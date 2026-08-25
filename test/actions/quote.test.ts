/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, expect, it } from 'vitest';

import { router } from '../../nodes/Freedom24/actions/router';
import { createFakeExecuteFunctions } from '../helpers/fakeExecuteFunctions';

const AUTH = { type: 'apiKey' as const, publicKey: 'pub', privateKey: 'priv' };

describe('quote.get', () => {
	it('returns the first flat quote record when simplify is on', async () => {
		const { ctx } = createFakeExecuteFunctions({
			params: {
				resource: 'quote',
				operation: 'get',
				ticker: { mode: 'id', value: 'AAPL.US' },
				simplify: true,
			},
			httpRequest: async () => ({
				statusCode: 200,
				body: JSON.stringify({ quotes: { q: [{ c: 'AAPL.US', ltp: 150.5 }] } }),
			}),
		});

		await expect(router.call(ctx, 0, AUTH)).resolves.toEqual({ c: 'AAPL.US', ltp: 150.5 });
	});

	it('returns an empty object, not the raw envelope, when the ticker has no quote records', async () => {
		const { ctx } = createFakeExecuteFunctions({
			params: {
				resource: 'quote',
				operation: 'get',
				ticker: { mode: 'id', value: 'DELISTED.US' },
				simplify: true,
			},
			httpRequest: async () => ({
				statusCode: 200,
				body: JSON.stringify({ quotes: { q: [] } }),
			}),
		});

		await expect(router.call(ctx, 0, AUTH)).resolves.toEqual({});
	});

	it('falls back to the raw envelope when no known response shape matches at all', async () => {
		const { ctx } = createFakeExecuteFunctions({
			params: {
				resource: 'quote',
				operation: 'get',
				ticker: { mode: 'id', value: 'AAPL.US' },
				simplify: true,
			},
			httpRequest: async () => ({
				statusCode: 200,
				body: JSON.stringify({ somethingUnexpected: true }),
			}),
		});

		await expect(router.call(ctx, 0, AUTH)).resolves.toEqual({ somethingUnexpected: true });
	});
});
