/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, expect, it } from 'vitest';

import { router } from '../../nodes/Freedom24/actions/router';
import { createFakeExecuteFunctions } from '../helpers/fakeExecuteFunctions';

const AUTH = { type: 'apiKey' as const, publicKey: 'pub', privateKey: 'priv' };

describe('dynamic.call — mutation safety gate', () => {
	it('refuses a command from the broadened prefix list without confirm', async () => {
		const { ctx, httpCalls } = createFakeExecuteFunctions({
			params: {
				resource: 'dynamic',
				operation: 'call',
				command: 'cancelSomething',
				parametersJson: '{}',
				dryRun: false,
				confirm: false,
			},
		});

		await expect(router.call(ctx, 0, AUTH)).rejects.toThrow(/looks like it mutates/);
		expect(httpCalls).toHaveLength(0);
	});

	it('allows a read command through with no confirm required', async () => {
		const { ctx } = createFakeExecuteFunctions({
			params: {
				resource: 'dynamic',
				operation: 'call',
				command: 'getSomething',
				parametersJson: '{}',
				dryRun: false,
				confirm: false,
			},
			httpRequest: async () => ({ statusCode: 200, body: JSON.stringify({ ok: true }) }),
		});

		await expect(router.call(ctx, 0, AUTH)).resolves.toEqual({ ok: true });
	});

	it('dry run never calls the network, regardless of the command', async () => {
		const { ctx, httpCalls } = createFakeExecuteFunctions({
			params: {
				resource: 'dynamic',
				operation: 'call',
				command: 'putSomething',
				parametersJson: '{"a":1}',
				dryRun: true,
				confirm: false,
			},
		});

		const result = await router.call(ctx, 0, AUTH);
		expect(result).toEqual({ dryRun: true, command: 'putSomething', params: { a: 1 } });
		expect(httpCalls).toHaveLength(0);
	});

	it('malformed JSON parameters raise a NodeOperationError naming the field, with itemIndex', async () => {
		const { ctx } = createFakeExecuteFunctions({
			params: {
				resource: 'dynamic',
				operation: 'call',
				command: 'getSomething',
				parametersJson: '{not valid',
				dryRun: false,
				confirm: false,
			},
		});

		try {
			await router.call(ctx, 2, AUTH);
			expect.unreachable('expected router to throw');
		} catch (error) {
			expect((error as Error).message).toMatch(/parametersJson/);
			expect((error as { context?: { itemIndex?: number } }).context?.itemIndex).toBe(2);
		}
	});
});
