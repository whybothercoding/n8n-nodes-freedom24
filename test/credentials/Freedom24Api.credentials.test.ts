/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import * as crypto from 'crypto';
import { describe, expect, it } from 'vitest';

import { Freedom24Api } from '../../credentials/Freedom24Api.credentials';

function referenceSignature(privateKey: string, payload: string, timestamp: number): string {
	return crypto
		.createHmac('sha256', privateKey)
		.update(payload + timestamp)
		.digest('hex');
}

describe('Freedom24Api.authenticate', () => {
	it('signs an object body, replacing it with the exact JSON string that gets signed', async () => {
		const credential = new Freedom24Api();
		const result = await credential.authenticate(
			{ publicKey: 'pub-key', privateKey: 'priv-key' },
			{ method: 'POST', url: 'https://freedom24.com/api/getOPQ', body: {} },
		);

		expect(result.body).toBe('{}');
		expect(result.headers?.['X-NtApi-PublicKey']).toBe('pub-key');
		const timestamp = Number(result.headers?.['X-NtApi-Timestamp']);
		expect(result.headers?.['X-NtApi-Sig']).toBe(referenceSignature('priv-key', '{}', timestamp));
	});

	it('signs a pre-serialized string body as-is, without re-stringifying it', async () => {
		const credential = new Freedom24Api();
		const result = await credential.authenticate(
			{ publicKey: 'pub-key', privateKey: 'priv-key' },
			{ method: 'POST', url: 'https://freedom24.com/api/getOPQ', body: '{"a":1}' },
		);

		expect(result.body).toBe('{"a":1}');
		const timestamp = Number(result.headers?.['X-NtApi-Timestamp']);
		expect(result.headers?.['X-NtApi-Sig']).toBe(referenceSignature('priv-key', '{"a":1}', timestamp));
	});

	it('preserves headers already set on the request options', async () => {
		const credential = new Freedom24Api();
		const result = await credential.authenticate(
			{ publicKey: 'pub-key', privateKey: 'priv-key' },
			{
				method: 'POST',
				url: 'https://freedom24.com/api/getOPQ',
				body: {},
				headers: { 'X-Custom-Header': 'keep-me' },
			},
		);

		expect(result.headers?.['X-Custom-Header']).toBe('keep-me');
	});
});

describe('Freedom24Api.test', () => {
	it('probes the real getOPQ endpoint with an empty JSON body', () => {
		const credential = new Freedom24Api();
		expect(credential.test.request).toMatchObject({
			baseURL: 'https://freedom24.com/api',
			url: '/getOPQ',
			method: 'POST',
			body: {},
		});
	});
});
