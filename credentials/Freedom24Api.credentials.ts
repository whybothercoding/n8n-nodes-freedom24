import {
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';

import { buildApiKeyHeaders } from '../nodes/Freedom24/transport/signing';

const BASE_URL = 'https://freedom24.com/api';

export class Freedom24Api implements ICredentialType {
	name = 'freedom24Api';
	displayName = 'Freedom24 API';
	documentationUrl = 'https://tradernet.com/api';
	icon = 'file:freedom24.svg' as const;

	// HMAC-signs every request with these credentials (reusing the same pure signPayload/
	// buildApiKeyHeaders the node's real API calls use — see transport/signing.ts), which is what
	// lets `test` below do a real signed probe instead of the unauthenticated GET this credential
	// used to declare (which passed for any input, valid or not). Verified against the live API
	// 2026-08-26 (against tradernet.com/api at the time): a bad public key or bad signature both
	// come back as a real HTTP 403 with a `{"error": "..."}` body — not Tradernet's usual "200 with
	// the failure in the body" shape — so the default non-2xx check below is a genuine test.
	// BASE_URL moved to freedom24.com (2026-09-10) to match every other proven-live call in
	// production use of this API (reads and writes) — tradernet.com works for reads but isn't
	// verified for mutating commands and was returning "Invalid signature provided" on the old
	// /api/v2/cmd/{command} write path.
	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		const publicKey = credentials.publicKey as string;
		const privateKey = credentials.privateKey as string;
		const payload =
			typeof requestOptions.body === 'string' ? requestOptions.body : JSON.stringify(requestOptions.body ?? {});
		const timestamp = Math.floor(Date.now() / 1000);

		return {
			...requestOptions,
			body: payload,
			headers: {
				...requestOptions.headers,
				...buildApiKeyHeaders(publicKey, privateKey, payload, timestamp),
			},
		};
	}

	test: ICredentialTestRequest = {
		request: {
			baseURL: BASE_URL,
			url: '/getOPQ',
			method: 'POST',
			body: {},
		},
	};

	properties: INodeProperties[] = [
		{
			displayName: 'Public Key',
			name: 'publicKey',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
		},
	];
}
