 
import { describe, expect, it } from 'vitest';

import { makeRequest } from '../../nodes/Freedom24/transport/request';
import type { FakeHttpResponse } from '../helpers/fakeExecuteFunctions';
import { createFakeExecuteFunctions } from '../helpers/fakeExecuteFunctions';

const API_KEY_AUTH = { type: 'apiKey' as const, publicKey: 'pub', privateKey: 'priv' };
const SESSION_AUTH = { type: 'userLogin' as const, sid: 'sid-123' };

function ok(body: unknown): FakeHttpResponse {
	return { statusCode: 200, body: JSON.stringify(body) };
}

describe('makeRequest — fixedV2/fixedV1 (the two proven trading mutations)', () => {
	it('fixedV2 hits the plain v1-shaped endpoint and never falls back, even on 404', async () => {
		// There is no working /api/v2/cmd/{command} shape under this header-HMAC auth scheme —
		// confirmed live 2026-09-11 (T09 migration testing): it returns "Invalid signature
		// provided" regardless of auth correctness. fixedV2 resolves to the same endpoint as
		// fixedV1; see the RequestStrategy doc comment.
		const { ctx, httpCalls } = createFakeExecuteFunctions({
			params: {},
			httpRequest: async () => ({ statusCode: 404, body: JSON.stringify({ error: 'Command not found' }) }),
		});

		await expect(
			makeRequest.call(ctx, 'putTradeOrder', { qty: 1 }, API_KEY_AUTH, 'fixedV2'),
		).rejects.toThrow(/rejected "putTradeOrder"/);

		expect(httpCalls).toHaveLength(1);
		expect(httpCalls[0].url).toBe('https://freedom24.com/api/putTradeOrder');
	});

	it('fixedV1 hits the plain v1 endpoint and never falls back', async () => {
		const { ctx, httpCalls } = createFakeExecuteFunctions({
			params: {},
			httpRequest: async () => ({ statusCode: 404, body: '{}' }),
		});

		await expect(
			makeRequest.call(ctx, 'delTradeOrder', { order_id: '1' }, API_KEY_AUTH, 'fixedV1'),
		).rejects.toThrow(/HTTP 404/);

		expect(httpCalls).toHaveLength(1);
		expect(httpCalls[0].url).toBe('https://freedom24.com/api/delTradeOrder');
	});
});

describe('makeRequest — auto strategy fallback', () => {
	it('a read command falls back v1 -> wrapped on 404', async () => {
		let call = 0;
		const { ctx, httpCalls } = createFakeExecuteFunctions({
			params: {},
			httpRequest: async () => {
				call += 1;
				if (call === 1) return { statusCode: 404, body: JSON.stringify({ error: 'Command not found' }) };
				return ok({ result: 'fallback worked' });
			},
		});

		const result = await makeRequest.call(ctx, 'someReadCommand', {}, API_KEY_AUTH, 'auto');

		expect(result).toEqual({ result: 'fallback worked' });
		expect(httpCalls).toHaveLength(2);
		expect(httpCalls[0].url).toBe('https://freedom24.com/api/someReadCommand');
		// Second call is the wrapped query form: base URL + qs.q
		expect(httpCalls[1].url).toBe('https://freedom24.com/api');
		expect(httpCalls[1].qs).toBeDefined();
	});

	it('a put-prefixed command gets no special v2 treatment — goes straight to v1, falls back to wrapped on 404', async () => {
		// There is no working v2 endpoint to try first (see the RequestStrategy doc comment) — a
		// put/del-prefixed command via 'auto' behaves identically to any other command.
		const seenUrls: string[] = [];
		const { ctx, httpCalls } = createFakeExecuteFunctions({
			params: {},
			httpRequest: async (opts) => {
				seenUrls.push(opts.url);
				if (opts.url === 'https://freedom24.com/api/putSomethingUnknown') {
					return { statusCode: 404, body: '{}' };
				}
				return ok({ ok: true });
			},
		});

		const result = await makeRequest.call(ctx, 'putSomethingUnknown', {}, API_KEY_AUTH, 'auto');

		expect(result).toEqual({ ok: true });
		expect(httpCalls).toHaveLength(2);
		expect(seenUrls[0]).toBe('https://freedom24.com/api/putSomethingUnknown');
	});

	it('does NOT fall back on a 500 (only 404/"Command not found" trigger fallback)', async () => {
		const { ctx, httpCalls } = createFakeExecuteFunctions({
			params: {},
			httpRequest: async () => ({ statusCode: 500, body: 'Internal Server Error' }),
		});

		await expect(makeRequest.call(ctx, 'getSomething', {}, API_KEY_AUTH, 'auto')).rejects.toThrow(
			/HTTP 500/,
		);
		expect(httpCalls).toHaveLength(1);
	});
});

describe('makeRequest — response-body error detection', () => {
	it('throws when the 200 OK body carries an error field', async () => {
		const { ctx } = createFakeExecuteFunctions({
			params: {},
			httpRequest: async () => ok({ error: 'Invalid ticker' }),
		});

		await expect(
			makeRequest.call(ctx, 'getSecurityInfo', {}, API_KEY_AUTH, 'auto'),
		).rejects.toThrow(/Invalid ticker/);
	});

	it('throws when the 200 OK body carries an errMsg field', async () => {
		const { ctx } = createFakeExecuteFunctions({
			params: {},
			httpRequest: async () => ok({ errMsg: 'Insufficient funds' }),
		});

		await expect(makeRequest.call(ctx, 'putTradeOrder', {}, API_KEY_AUTH, 'fixedV2')).rejects.toThrow(
			/Insufficient funds/,
		);
	});

	it('resolves cleanly for a genuinely successful response', async () => {
		const { ctx } = createFakeExecuteFunctions({
			params: {},
			httpRequest: async () => ok({ result: 'ok' }),
		});

		await expect(
			makeRequest.call(ctx, 'getMarketStatus', {}, API_KEY_AUTH, 'auto'),
		).resolves.toEqual({ result: 'ok' });
	});

	it('wraps a transport-level exception in NodeApiError', async () => {
		const { ctx } = createFakeExecuteFunctions({
			params: {},
			httpRequest: async () => {
				throw new Error('ECONNRESET');
			},
		});

		await expect(makeRequest.call(ctx, 'getOPQ', {}, API_KEY_AUTH, 'auto')).rejects.toThrow(
			/request failed/,
		);
	});
});

describe('makeRequest — session (User Login) auth', () => {
	it('sends cmd/params/SID wrapped in the q query param, regardless of strategy', async () => {
		const { ctx, httpCalls } = createFakeExecuteFunctions({
			params: {},
			httpRequest: async () => ok({ result: 'ok' }),
		});

		await makeRequest.call(ctx, 'getOPQ', { a: 1 }, SESSION_AUTH, 'auto');

		expect(httpCalls).toHaveLength(1);
		expect(httpCalls[0].url).toBe('https://freedom24.com/api');
		const q = JSON.parse((httpCalls[0].qs as Record<string, string>).q);
		expect(q).toEqual({ cmd: 'getOPQ', params: { a: 1 }, SID: 'sid-123' });
	});
});
