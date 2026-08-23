import * as crypto from 'crypto';

/**
 * Tradernet's API Key auth scheme: HMAC-SHA256 over `payload + timestamp`, hex-encoded.
 * Matches the vendor's documented Node.js example (tradernet.com/tradernet-api).
 */
export function signPayload(privateKey: string, payload: string, timestamp: number): string {
	return crypto
		.createHmac('sha256', privateKey)
		.update(payload + timestamp)
		.digest('hex');
}

export function buildApiKeyHeaders(
	publicKey: string,
	privateKey: string,
	payload: string,
	timestamp: number,
): Record<string, string> {
	return {
		'Content-Type': 'application/json',
		'X-NtApi-PublicKey': publicKey,
		'X-NtApi-Timestamp': timestamp.toString(),
		'X-NtApi-Sig': signPayload(privateKey, payload, timestamp),
	};
}
