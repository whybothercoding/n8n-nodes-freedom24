import { JsonObject, NodeApiError, NodeOperationError } from 'n8n-workflow';

import { HttpContext } from './request';

const BASE_URL = 'https://tradernet.com/api';

/**
 * Logs in with email/password and returns the SID session cookie. Tradernet's own docs specify
 * `application/x-www-form-urlencoded` for this endpoint (not JSON) — getting that wrong fails
 * every User Login authenticated request. Typed against the same minimal HttpContext as the rest
 * of transport/, so it can also run from ILoadOptionsFunctions (the Ticker search).
 */
export async function getSessionId(
	this: HttpContext,
	login: string,
	password: string,
): Promise<string> {
	let response;
	try {
		response = await this.helpers.httpRequest({
			method: 'POST',
			url: `${BASE_URL}/check-login-password`,
			body: new URLSearchParams({ login, password, rememberMe: '1' }).toString(),
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			returnFullResponse: true,
			ignoreHttpStatusErrors: true,
		});
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as unknown as JsonObject, {
			message: 'Freedom24 login request failed',
		});
	}

	if (response.statusCode !== 200) {
		throw new NodeApiError(this.getNode(), response as unknown as JsonObject, {
			message: 'Freedom24 login failed: invalid credentials or server error',
		});
	}

	const body =
		typeof response.body === 'string' && response.body.length > 0
			? (JSON.parse(response.body) as { error?: string })
			: (response.body as { error?: string } | undefined);
	if (body?.error) {
		throw new NodeApiError(this.getNode(), body as JsonObject, {
			message: `Freedom24 login failed: ${body.error}`,
		});
	}

	const setCookie = response.headers['set-cookie'];
	if (!setCookie) {
		throw new NodeOperationError(
			this.getNode(),
			'Freedom24 login failed: no session cookie received. If this account requires SMS/2FA ' +
				'confirmation, User Login authentication is not currently supported here — use API Key ' +
				'authentication instead.',
		);
	}

	const cookies = Array.isArray(setCookie) ? setCookie.join(';') : setCookie;
	const match = cookies.match(/SID=([^;]+)/);
	if (!match) {
		throw new NodeOperationError(
			this.getNode(),
			'Freedom24 login failed: could not extract a session ID from the response',
		);
	}

	return match[1];
}
