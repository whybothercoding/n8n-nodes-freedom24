/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, expect, it } from 'vitest';

import { Freedom24 } from '../nodes/Freedom24/Freedom24.node';
import { createFakeExecuteFunctions } from './helpers/fakeExecuteFunctions';

describe('Freedom24 node description', () => {
	it('exposes all ten resources', () => {
		const node = new Freedom24();
		const resourceProperty = node.description.properties.find((p) => p.name === 'resource');
		const values = (resourceProperty?.options as Array<{ value: string }>).map((o) => o.value);
		expect(values.sort()).toEqual(
			['alert', 'dynamic', 'fx', 'history', 'market', 'order', 'portfolio', 'quote', 'security', 'watchlist'].sort(),
		);
	});

	it('registers credentialTest and listSearch methods', () => {
		const node = new Freedom24();
		expect(Object.keys(node.methods.credentialTest)).toContain('freedom24UserApiCredentialTest');
		expect(Object.keys(node.methods.listSearch)).toContain('searchTickers');
	});

	it('User Login is wired to a testedBy method, since Tradernet returns HTTP 200 even on bad login/password', () => {
		const node = new Freedom24();
		const userApiCredential = node.description.credentials?.find((c) => c.name === 'freedom24UserApi');
		expect(userApiCredential?.testedBy).toBe('freedom24UserApiCredentialTest');
	});

	it('API Key is not wired to a testedBy method — it uses the declarative test on Freedom24Api.credentials.ts', () => {
		const node = new Freedom24();
		const apiKeyCredential = node.description.credentials?.find((c) => c.name === 'freedom24Api');
		expect(apiKeyCredential?.testedBy).toBeUndefined();
	});
});

describe('Freedom24 execute — pairedItem and continueOnFail', () => {
	it('attaches pairedItem to every successful output item', async () => {
		const node = new Freedom24();
		const { ctx } = createFakeExecuteFunctions({
			params: [
				{ authentication: 'apiKey', resource: 'market', operation: 'getStatus', marketMode: '' },
				{ authentication: 'apiKey', resource: 'market', operation: 'getStatus', marketMode: '' },
			],
			items: [{ json: {} }, { json: {} }],
			credentials: { freedom24Api: { publicKey: 'pub', privateKey: 'priv' } },
			httpRequest: async () => ({ statusCode: 200, body: JSON.stringify({ result: 'open' }) }),
		});

		const [output] = await node.execute.call(ctx);

		expect(output).toHaveLength(2);
		expect(output[0].pairedItem).toEqual({ item: 0 });
		expect(output[1].pairedItem).toEqual({ item: 1 });
	});

	it('an auth failure with continueOnFail=true produces one error item per input item, not a thrown exception', async () => {
		const node = new Freedom24();
		const { ctx } = createFakeExecuteFunctions({
			params: { authentication: 'apiKey', resource: 'market', operation: 'getStatus' },
			items: [{ json: {} }, { json: {} }, { json: {} }],
			continueOnFail: true,
			// No credentials registered -> getCredentials throws.
		});

		const [output] = await node.execute.call(ctx);

		expect(output).toHaveLength(3);
		for (let i = 0; i < 3; i++) {
			expect(output[i].json).toHaveProperty('error');
			expect(output[i].pairedItem).toEqual({ item: i });
		}
	});

	it('an auth failure without continueOnFail throws', async () => {
		const node = new Freedom24();
		const { ctx } = createFakeExecuteFunctions({
			params: { authentication: 'apiKey', resource: 'market', operation: 'getStatus' },
			continueOnFail: false,
		});

		await expect(node.execute.call(ctx)).rejects.toThrow();
	});

	it('a per-item operation error is caught and reported with continueOnFail, without aborting other items', async () => {
		const node = new Freedom24();
		const { ctx } = createFakeExecuteFunctions({
			params: [
				{
					authentication: 'apiKey',
					resource: 'order',
					operation: 'place',
					ticker: 'AAPL.US',
					side: 'buy',
					type: 'limit',
					quantity: 1,
					price: 0, // invalid for a limit order
					expirationId: 3,
					dryRun: false,
					confirm: false,
				},
				{ authentication: 'apiKey', resource: 'market', operation: 'getStatus', marketMode: '' },
			],
			items: [{ json: {} }, { json: {} }],
			credentials: { freedom24Api: { publicKey: 'pub', privateKey: 'priv' } },
			continueOnFail: true,
			httpRequest: async () => ({ statusCode: 200, body: JSON.stringify({ result: 'open' }) }),
		});

		const [output] = await node.execute.call(ctx);

		expect(output).toHaveLength(2);
		expect(output[0].json).toHaveProperty('error');
		expect(output[0].pairedItem).toEqual({ item: 0 });
		expect(output[1].json).toEqual({ result: 'open' });
	});
});
