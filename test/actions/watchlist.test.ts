/* eslint-disable @n8n/community-nodes/no-restricted-imports */
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
			'https://tradernet.com/api/getUserStockLists',
			'https://tradernet.com/api/updateStockList',
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

		expect(calls).toEqual(['https://tradernet.com/api/updateStockList']);
	});

	it('a dry run reflects the backfilled values, since backfill is read-only', async () => {
		const { ctx } = createFakeExecuteFunctions({
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
			httpRequest: async () => ({
				statusCode: 200,
				body: JSON.stringify({ userStockLists: [{ id: 42, name: 'Existing', picture: '📈' }] }),
			}),
		});

		const result = await router.call(ctx, 0, AUTH);
		expect(result).toMatchObject({
			dryRun: true,
			params: { id: 42, name: 'Existing', picture: '📈', index: 0 },
		});
	});
});
