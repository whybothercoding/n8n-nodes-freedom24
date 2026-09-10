 
import { describe, expect, it } from 'vitest';

import { router } from '../../nodes/Freedom24/actions/router';
import { createFakeExecuteFunctions } from '../helpers/fakeExecuteFunctions';

const AUTH = { type: 'apiKey' as const, publicKey: 'pub', privateKey: 'priv' };

describe('history.getCashflows', () => {
	it('runs without From/Till in the params bag — they are not displayed for this operation', async () => {
		// The fake's getNodeParameter throws for a parameter that isn't present and has no
		// fallback default supplied — this is the same failure mode n8n itself produces for a
		// hidden/undisplayed parameter, so if the executor ever reads "from"/"till" unconditionally
		// again for this operation, this test fails.
		const { ctx } = createFakeExecuteFunctions({
			params: {
				resource: 'history',
				operation: 'getCashflows',
				userId: 0,
				groupByType: false,
				cashTotals: false,
				hideLimits: false,
				take: 50,
				skip: 0,
				withoutRefund: false,
				filtersJson: '[]',
				sortJson: '[]',
			},
			httpRequest: async () => ({ statusCode: 200, body: JSON.stringify({ result: [] }) }),
		});

		await expect(router.call(ctx, 0, AUTH)).resolves.toEqual({ result: [] });
	});

	it('errors instead of silently dropping filtersJson when it is valid JSON but not an array', async () => {
		const { ctx, httpCalls } = createFakeExecuteFunctions({
			params: {
				resource: 'history',
				operation: 'getCashflows',
				userId: 0,
				groupByType: false,
				cashTotals: false,
				hideLimits: false,
				take: 50,
				skip: 0,
				withoutRefund: false,
				filtersJson: '{"field":"amount","op":"gt","value":100}',
				sortJson: '[]',
			},
		});

		await expect(router.call(ctx, 0, AUTH)).rejects.toThrow(/filtersJson/);
		expect(httpCalls).toHaveLength(0);
	});
});

describe('history.getOrders', () => {
	it('sends the raw From/Till values as-is', async () => {
		const { ctx, httpCalls } = createFakeExecuteFunctions({
			params: {
				resource: 'history',
				operation: 'getOrders',
				from: '2026-01-01T00:00:00.000Z',
				till: '2026-01-31T23:59:59.000Z',
			},
			httpRequest: async () => ({ statusCode: 200, body: JSON.stringify({ result: [] }) }),
		});

		await router.call(ctx, 0, AUTH);
		const body = JSON.parse(httpCalls[0].body as string);
		expect(body).toEqual({ from: '2026-01-01T00:00:00.000Z', till: '2026-01-31T23:59:59.000Z' });
	});
});
