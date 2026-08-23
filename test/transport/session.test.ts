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
