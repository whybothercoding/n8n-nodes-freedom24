 
import { describe, expect, it } from 'vitest';

import { router } from '../../nodes/Freedom24/actions/router';
import { createFakeExecuteFunctions } from '../helpers/fakeExecuteFunctions';

const AUTH = { type: 'apiKey' as const, publicKey: 'pub', privateKey: 'priv' };

describe('order.place', () => {
	it('dry run returns the payload without ever calling httpRequest', async () => {
		const { ctx, httpCalls } = createFakeExecuteFunctions({
			params: {
				resource: 'order',
				operation: 'place',
				ticker: { mode: 'id', value: 'AAPL.US' },
				side: 'buy',
				type: 'market',
				quantity: 5,
				takeProfit: 0,
				stopLoss: 0,
				stopLossPercent: 0,
				trailingPercent: 0,
				expirationId: 3,
				dryRun: true,
				confirm: false,
			},
		});

		const result = await router.call(ctx, 0, AUTH);

		expect(httpCalls).toHaveLength(0);
		expect(result).toMatchObject({
			dryRun: true,
			command: 'putTradeOrder',
			params: { instr_name: 'AAPL.US', action_id: 1, order_type_id: 1, qty: 5 },
		});
	});

	it('refuses to place a live order without confirm=true', async () => {
		const { ctx, httpCalls } = createFakeExecuteFunctions({
			params: {
				resource: 'order',
				operation: 'place',
				ticker: 'AAPL.US',
				side: 'buy',
				type: 'market',
				quantity: 1,
				expirationId: 3,
				dryRun: false,
				confirm: false,
			},
		});

		await expect(router.call(ctx, 0, AUTH)).rejects.toThrow(/confirm=true/);
		expect(httpCalls).toHaveLength(0);
	});

	it('a limit order with no price is rejected before any network call, with itemIndex attached', async () => {
		const { ctx, httpCalls } = createFakeExecuteFunctions({
			params: {
				resource: 'order',
				operation: 'place',
				ticker: 'AAPL.US',
				side: 'buy',
				type: 'limit',
				quantity: 1,
				price: 0,
				expirationId: 3,
				dryRun: true,
				confirm: false,
			},
		});

		try {
			await router.call(ctx, 3, AUTH);
			expect.unreachable('expected router to throw');
		} catch (error) {
			expect((error as Error).message).toMatch(/Limit orders require a Price/);
			expect((error as { context?: { itemIndex?: number } }).context?.itemIndex).toBe(3);
		}
		expect(httpCalls).toHaveLength(0);
	});

	it('confirmed places the order via the plain endpoint (fixedV2 has no working v2 shape)', async () => {
		const { ctx, httpCalls } = createFakeExecuteFunctions({
			params: {
				resource: 'order',
				operation: 'place',
				ticker: 'AAPL.US',
				side: 'buy',
				type: 'market',
				quantity: 1,
				expirationId: 3,
				dryRun: false,
				confirm: true,
			},
			httpRequest: async () => ({
				statusCode: 200,
				body: JSON.stringify({ order_id: '999' }),
			}),
		});

		const result = await router.call(ctx, 0, AUTH);

		expect(result).toEqual({ order_id: '999' });
		expect(httpCalls).toHaveLength(1);
		expect(httpCalls[0].url).toBe('https://freedom24.com/api/putTradeOrder');
	});
});

describe('order.bulkCancel', () => {
	it('settles each cancellation independently — one failure does not hide the others', async () => {
		const { ctx } = createFakeExecuteFunctions({
			params: {
				resource: 'order',
				operation: 'bulkCancel',
				orderIds: '1,2,3',
				dryRun: false,
				confirm: true,
			},
			httpRequest: async (opts) => {
				const body = JSON.parse(opts.body as string) as { order_id: string };
				if (body.order_id === '2') return { statusCode: 200, body: JSON.stringify({ error: 'Order not found' }) };
				return { statusCode: 200, body: JSON.stringify({ success: true }) };
			},
		});

		const result = (await router.call(ctx, 0, AUTH)) as Array<Record<string, unknown>>;

		expect(result).toHaveLength(3);
		expect(result[0]).toMatchObject({ order_id: '1', success: true });
		expect(result[1]).toMatchObject({ order_id: '2', success: false });
		expect(result[2]).toMatchObject({ order_id: '3', success: true });
	});
});

describe('order.getAll simplify', () => {
	it('unwraps the orders envelope into a plain array', async () => {
		const { ctx } = createFakeExecuteFunctions({
			params: { resource: 'order', operation: 'getAll', simplify: true },
			httpRequest: async () => ({
				statusCode: 200,
				body: JSON.stringify({ orders: [{ id: 1 }, { id: 2 }] }),
			}),
		});

		const result = await router.call(ctx, 0, AUTH);
		expect(result).toEqual([{ id: 1 }, { id: 2 }]);
	});

	it('returns the raw envelope when simplify is off', async () => {
		const { ctx } = createFakeExecuteFunctions({
			params: { resource: 'order', operation: 'getAll', simplify: false },
			httpRequest: async () => ({
				statusCode: 200,
				body: JSON.stringify({ orders: [{ id: 1 }] }),
			}),
		});

		const result = await router.call(ctx, 0, AUTH);
		expect(result).toEqual({ orders: [{ id: 1 }] });
	});
});
