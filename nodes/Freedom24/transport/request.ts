import { IDataObject, IHttpRequestOptions, INode, NodeApiError, JsonObject } from 'n8n-workflow';

import { buildApiKeyHeaders } from './signing';
import { getApiError, isCommandNotFound } from '../helpers/responses';

const BASE_URL = 'https://freedom24.com/api';
const V2_BASE_URL = 'https://freedom24.com/api/v2';

interface FullHttpResponse {
	statusCode: number;
	body: unknown;
	headers: Record<string, string | string[]>;
}

/**
 * The minimal surface this module needs — deliberately narrower than IExecuteFunctions so the
 * same transport code also works from ILoadOptionsFunctions (the Ticker resourceLocator search),
 * which exposes the same `helpers.httpRequest`/`getNode` but isn't an IExecuteFunctions.
 */
export interface HttpContext {
	helpers: { httpRequest(options: IHttpRequestOptions): Promise<FullHttpResponse> };
	getNode(): INode;
}

export type AuthContext =
	| { type: 'apiKey'; publicKey: string; privateKey: string }
	| { type: 'userLogin'; sid: string };

/**
 * How a command is routed. 'fixedV2'/'fixedV1' preserve exactly the endpoint each mutating
 * operation always used — no fallback, because silently retrying a trading mutation on a
 * different endpoint risks re-submitting it with different semantics (or twice). 'auto' is for
 * read-only commands and the `dynamic.call` escape hatch, where a fallback carries no such risk.
 */
export type RequestStrategy = 'fixedV2' | 'fixedV1' | 'auto';

// Not the same list as helpers/mutation.ts's own MUTATING_PREFIXES — that one is the broad,
// deliberately over-inclusive confirm-gate for dynamic.call; this one only decides whether the
// 'auto' strategy below tries the v2 endpoint before v1 for known put/delete-style commands.
const MUTATING_PREFIXES = ['put', 'del'];

export function isMutatingCommand(command: string): boolean {
	return MUTATING_PREFIXES.some((prefix) => command.startsWith(prefix));
}

interface RawResult {
	statusCode: number;
	body: IDataObject;
}

/** Exported so other transport-adjacent code (session.ts, credentialTest.ts) shares this same
 * "never let a non-JSON body throw a raw SyntaxError" guard instead of re-rolling it. */
export function parseBody(body: unknown): IDataObject {
	if (typeof body === 'string') {
		if (body.length === 0) return {};
		try {
			return JSON.parse(body) as IDataObject;
		} catch {
			// A non-2xx response (a proxy error page, a plain-text 500) isn't guaranteed to be JSON.
			// Keep it as an opaque error body rather than letting JSON.parse throw and mask the real
			// HTTP status behind a generic "request failed".
			return { raw: body };
		}
	}
	return (body ?? {}) as IDataObject;
}

async function rawRequest(
	this: HttpContext,
	opts: { url: string; body?: string; qs?: IDataObject; headers: Record<string, string> },
): Promise<RawResult> {
	const response = await this.helpers.httpRequest({
		method: 'POST',
		url: opts.url,
		body: opts.body,
		qs: opts.qs,
		headers: opts.headers,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	});
	return { statusCode: response.statusCode, body: parseBody(response.body) };
}

function apiKeyHeaders(auth: Extract<AuthContext, { type: 'apiKey' }>, payload: string) {
	const timestamp = Math.floor(Date.now() / 1000);
	return buildApiKeyHeaders(auth.publicKey, auth.privateKey, payload, timestamp);
}

async function requestV2(
	this: HttpContext,
	command: string,
	params: IDataObject,
	auth: Extract<AuthContext, { type: 'apiKey' }>,
): Promise<RawResult> {
	const payload = JSON.stringify(params);
	return rawRequest.call(this, {
		url: `${V2_BASE_URL}/cmd/${command}`,
		body: payload,
		headers: apiKeyHeaders(auth, payload),
	});
}

async function requestV1(
	this: HttpContext,
	command: string,
	params: IDataObject,
	auth: Extract<AuthContext, { type: 'apiKey' }>,
): Promise<RawResult> {
	const payload = JSON.stringify(params);
	return rawRequest.call(this, {
		url: `${BASE_URL}/${command}`,
		body: payload,
		headers: apiKeyHeaders(auth, payload),
	});
}

/** Older-style "wrapped" endpoint: cmd+params travel as a signed `q` query param, empty body. */
async function requestV1Wrapped(
	this: HttpContext,
	command: string,
	params: IDataObject,
	auth: Extract<AuthContext, { type: 'apiKey' }>,
): Promise<RawResult> {
	return rawRequest.call(this, {
		url: BASE_URL,
		qs: { q: JSON.stringify({ cmd: command, params }) },
		headers: apiKeyHeaders(auth, ''),
	});
}

async function requestSession(
	this: HttpContext,
	command: string,
	params: IDataObject,
	sid: string,
): Promise<RawResult> {
	return rawRequest.call(this, {
		url: BASE_URL,
		qs: { q: JSON.stringify({ cmd: command, params, SID: sid }) },
		headers: { 'Content-Type': 'application/json' },
	});
}

// No retry-with-delay here: n8n community nodes run in a sandboxed environment that disallows
// timers (setTimeout/setInterval are banned globals for cloud compatibility — see
// @n8n/community-nodes/no-restricted-globals), so a real backoff delay isn't available inside a
// node's execute(). A same-tick retry would just hit the rate limit again, so on a 429 this
// surfaces the error immediately rather than pretending to back off.

async function resolve(
	this: HttpContext,
	command: string,
	params: IDataObject,
	auth: AuthContext,
	strategy: RequestStrategy,
): Promise<RawResult> {
	const mutating = isMutatingCommand(command);

	if (auth.type === 'userLogin') {
		// Session auth has one working request shape for every command — no v1/v2 split — so there
		// is nothing to fall back to.
		return requestSession.call(this, command, params, auth.sid);
	}

	if (strategy === 'fixedV2') {
		return requestV2.call(this, command, params, auth);
	}
	if (strategy === 'fixedV1') {
		return requestV1.call(this, command, params, auth);
	}

	// 'auto': read-only commands and the dynamic-call escape hatch. A fallback to a different
	// endpoint shape is only safe here because it only ever triggers on an unambiguous 404 /
	// "Command not found" — never on a 5xx/timeout, where a mutating command may have already
	// executed server-side.
	let result: RawResult;
	if (mutating) {
		result = await requestV2.call(this, command, params, auth);
		if (result.statusCode === 404 || isCommandNotFound(result.body)) {
			result = await requestV1.call(this, command, params, auth);
		}
	} else {
		result = await requestV1.call(this, command, params, auth);
	}

	if (result.statusCode === 404 || isCommandNotFound(result.body)) {
		result = await requestV1Wrapped.call(this, command, params, auth);
	}

	return result;
}

export async function makeRequest(
	this: HttpContext,
	command: string,
	params: IDataObject,
	auth: AuthContext,
	strategy: RequestStrategy,
): Promise<IDataObject> {
	let result: RawResult;
	try {
		result = await resolve.call(this, command, params, auth, strategy);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: `Freedom24 request failed for command "${command}"`,
		});
	}

	const apiError = getApiError(result.body);
	if (apiError) {
		throw new NodeApiError(this.getNode(), result.body as JsonObject, {
			message: `Freedom24 rejected "${command}": ${apiError}`,
		});
	}

	// ignoreHttpStatusErrors above means a non-2xx with no Tradernet-style {error}/{errMsg} body
	// (a plain 401/429/5xx) would otherwise pass through silently as if it were a valid response.
	if (result.statusCode < 200 || result.statusCode >= 300) {
		throw new NodeApiError(this.getNode(), result.body as JsonObject, {
			message: `Freedom24 returned HTTP ${result.statusCode} for "${command}"`,
		});
	}

	return result.body;
}
