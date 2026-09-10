 
import { describe, expect, it } from 'vitest';

import { router } from '../../nodes/Freedom24/actions/router';
import { createFakeExecuteFunctions } from '../helpers/fakeExecuteFunctions';

const AUTH = { type: 'apiKey' as const, publicKey: 'pub', privateKey: 'priv' };

describe('watchlist.update', () => {
	it('backfills name/picture from the current record when left blank', async () => {
		const calls: string[] = [];
		const { ctx } = createFakeExecuteFunctions({
			params: {
				resource: 'watchlist',
				operation: 'update',
				listId: 42,
				name: '',
				picture: '',
				index: 1,
				dryRun: false,
				confirm: true,
			},
			httpRequest: async (opts) => {
				calls.push(opts.url);
				if (opts.url.endsWith('/getUserStockLists')) {
					return {
						statusCode: 200,
						body: JSON.stringify({
							userStockLists: [{ id: 42, name: 'Current Name', picture: '📈' }],
						}),
					};
				}
				return { statusCode: 200, body: JSON.stringify({ success: true, sent: opts.body }) };
			},
		});

		await router.call(ctx, 0, AUTH);

		expect(calls).toEqual([
			'https://freedom24.com/api/getUserStockLists',
			'https://freedom24.com/api/updateStockList',
		]);
	});

	it('does not fetch the current record when both name and picture are supplied', async () => {
		const calls: string[] = [];
		const { ctx } = createFakeExecuteFunctions({
			params: {
				resource: 'watchlist',
				operation: 'update',
				listId: 42,
				name: 'New Name',
				picture: '🚀',
				index: 0,
				dryRun: false,
				confirm: true,
			},
			httpRequest: async (opts) => {
				calls.push(opts.url);
				return { statusCode: 200, body: JSON.stringify({ success: true }) };
			},
		});

		await router.call(ctx, 0, AUTH);

		expect(calls).toEqual(['https://freedom24.com/api/updateStockList']);
	});

	it('a dry run never calls the network, even when name/picture are left blank', async () => {
		const { ctx, httpCalls } = createFakeExecuteFunctions({
			params: {
				resource: 'watchlist',
				operation: 'update',
				listId: 42,
				name: '',
				picture: '',
				index: 0,
				dryRun: true,
				confirm: false,
			},
			httpRequest: async () => {
				throw new Error('dryRun must not call the network');
			},
		});

		const result = await router.call(ctx, 0, AUTH);
		expect(httpCalls).toHaveLength(0);
		expect(result).toMatchObject({
			dryRun: true,
			params: { id: 42, index: 0 },
		});
	});

	it('a dry run reflects the raw provided values, unbackfilled', async () => {
		const { ctx, httpCalls } = createFakeExecuteFunctions({
			params: {
				resource: 'watchlist',
				operation: 'update',
				listId: 42,
				name: 'Draft Name',
				picture: '',
				index: 0,
				dryRun: true,
				confirm: false,
			},
		});

		const result = await router.call(ctx, 0, AUTH);
		expect(httpCalls).toHaveLength(0);
		expect(result).toMatchObject({
			dryRun: true,
			params: { id: 42, name: 'Draft Name', index: 0 },
		});
	});
});
