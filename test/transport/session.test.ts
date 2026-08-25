/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, expect, it } from 'vitest';

import { getSessionId } from '../../nodes/Freedom24/transport/session';
import { createFakeExecuteFunctions } from '../helpers/fakeExecuteFunctions';

describe('getSessionId', () => {
	it('posts form-urlencoded (not JSON) per Tradernet\'s documented login contract', async () => {
		const { ctx, httpCalls } = createFakeExecuteFunctions({
			params: {},
			httpRequest: async () => ({
				statusCode: 200,
				body: '{}',
				headers: { 'set-cookie': ['SID=abc123; Path=/; HttpOnly'] },
			}),
		});

		const sid = await getSessionId.call(ctx, 'user@example.com', 'hunter2');

		expect(sid).toBe('abc123');
		expect(httpCalls).toHaveLength(1);
		expect(httpCalls[0].headers).toMatchObject({
			'Content-Type': 'application/x-www-form-urlencoded',
		});
		expect(httpCalls[0].body).toBe('login=user%40example.com&password=hunter2&rememberMe=1');
	});

	it('throws when the login body carries an error field, even with HTTP 200', async () => {
		const { ctx } = createFakeExecuteFunctions({
			params: {},
			httpRequest: async () => ({
				statusCode: 200,
				body: JSON.stringify({ error: 'Invalid credentials' }),
				headers: {},
			}),
		});

		await expect(getSessionId.call(ctx, 'user@example.com', 'wrong')).rejects.toThrow(
			/Invalid credentials/,
		);
	});

	it('throws when the login body carries an errMsg field instead of error', async () => {
		const { ctx } = createFakeExecuteFunctions({
			params: {},
			httpRequest: async () => ({
				statusCode: 200,
				body: JSON.stringify({ errMsg: 'invalid password' }),
				headers: {},
			}),
		});

		await expect(getSessionId.call(ctx, 'user@example.com', 'wrong')).rejects.toThrow(
			/invalid password/,
		);
	});

	it('fails cleanly instead of crashing on a non-JSON HTTP 200 body', async () => {
		const { ctx } = createFakeExecuteFunctions({
			params: {},
			httpRequest: async () => ({
				statusCode: 200,
				body: '<html>not json</html>',
				headers: {},
			}),
		});

		await expect(getSessionId.call(ctx, 'user@example.com', 'hunter2')).rejects.toThrow(
			/SMS\/2FA/,
		);
	});

	it('extracts SID even when preceded by another cookie whose name ends in "SID"', async () => {
		const { ctx } = createFakeExecuteFunctions({
			params: {},
			httpRequest: async () => ({
				statusCode: 200,
				body: '{}',
				headers: { 'set-cookie': ['PHPSESSID=wrongvalue; Path=/', 'SID=rightvalue; Path=/'] },
			}),
		});

		const sid = await getSessionId.call(ctx, 'user@example.com', 'hunter2');
		expect(sid).toBe('rightvalue');
	});

	it('throws when the response has no session cookie (e.g. SMS/2FA required)', async () => {
		const { ctx } = createFakeExecuteFunctions({
			params: {},
			httpRequest: async () => ({ statusCode: 200, body: '{}', headers: {} }),
		});

		await expect(getSessionId.call(ctx, 'user@example.com', 'hunter2')).rejects.toThrow(
			/SMS\/2FA/,
		);
	});

	it('throws on a non-200 status', async () => {
		const { ctx } = createFakeExecuteFunctions({
			params: {},
			httpRequest: async () => ({ statusCode: 500, body: '{}', headers: {} }),
		});

		await expect(getSessionId.call(ctx, 'user@example.com', 'hunter2')).rejects.toThrow(
			/invalid credentials or server error/,
		);
	});
});
