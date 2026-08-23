/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import * as crypto from 'crypto';
import { describe, expect, it } from 'vitest';

import { buildApiKeyHeaders, signPayload } from '../../nodes/Freedom24/transport/signing';

/**
 * Reimplements the HMAC independently (rather than importing signPayload's own internals) so
 * these tests catch a regression in the algorithm, key, or data-concatenation order — not just
 * "the function still returns whatever the function returns".
 */
function referenceSignature(privateKey: string, payload: string, timestamp: number): string {
	return crypto
		.createHmac('sha256', privateKey)
		.update(payload + timestamp)
		.digest('hex');
}

describe('signPayload', () => {
	it('matches an independent HMAC-SHA256 reference implementation', () => {
		const signature = signPayload('my-private-key', '{"a":10,"b":"foo"}', 1700000000);
		expect(signature).toBe(referenceSignature('my-private-key', '{"a":10,"b":"foo"}', 1700000000));
	});

	it('is sensitive to the timestamp (prevents replaying a signature at a different time)', () => {
		const a = signPayload('key', 'payload', 1000);
		const b = signPayload('key', 'payload', 1001);
		expect(a).not.toBe(b);
	});

	it('is sensitive to the payload', () => {
		const a = signPayload('key', 'payload-a', 1000);
		const b = signPayload('key', 'payload-b', 1000);
		expect(a).not.toBe(b);
	});
});

describe('buildApiKeyHeaders', () => {
	it('sets the exact headers Tradernet expects', () => {
		const headers = buildApiKeyHeaders('pub-key', 'priv-key', '{}', 1700000000);
		expect(headers).toEqual({
			'Content-Type': 'application/json',
			'X-NtApi-PublicKey': 'pub-key',
			'X-NtApi-Timestamp': '1700000000',
			'X-NtApi-Sig': referenceSignature('priv-key', '{}', 1700000000),
		});
	});
});
