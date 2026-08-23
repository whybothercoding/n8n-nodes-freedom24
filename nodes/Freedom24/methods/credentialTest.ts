import { ICredentialsDecrypted, ICredentialTestFunctions, INodeCredentialTestResult } from 'n8n-workflow';

import { buildApiKeyHeaders } from '../transport/signing';
import { getApiError } from '../helpers/responses';

const BASE_URL = 'https://tradernet.com/api';

/**
 * Both credential types previously "tested" themselves by hitting an unauthenticated public
 * endpoint — it passed with any garbage input. These perform an actual signed/authenticated
 * probe and fail correctly on bad credentials.
 */
export async function freedom24ApiCredentialTest(
	this: ICredentialTestFunctions,
	credential: ICredentialsDecrypted,
): Promise<INodeCredentialTestResult> {
	const publicKey = credential.data?.publicKey as string | undefined;
	const privateKey = credential.data?.privateKey as string | undefined;
	if (!publicKey || !privateKey) {
		return { status: 'Error', message: 'Public Key and Private Key are both required' };
	}

	const payload = JSON.stringify({});
	const timestamp = Math.floor(Date.now() / 1000);
	const headers = buildApiKeyHeaders(publicKey, privateKey, payload, timestamp);

	try {
		// ICredentialTestFunctions.helpers only ever exposes the deprecated `request` — there is no
		// `httpRequest` on this particular context to switch to.
		// eslint-disable-next-line @n8n/community-nodes/no-deprecated-workflow-functions
		const response = (await this.helpers.request({
			method: 'POST',
			uri: `${BASE_URL}/getOPQ`,
			body: payload,
			headers,
			resolveWithFullResponse: true,
			simple: false,
		})) as { statusCode: number; body: unknown };

		const body =
			typeof response.body === 'string' && response.body.length > 0
				? JSON.parse(response.body)
				: response.body;
		const apiError = getApiError(body);

		if (response.statusCode !== 200 || apiError) {
			return {
				status: 'Error',
				message: apiError ?? `Freedom24 returned HTTP ${response.statusCode}`,
			};
		}
		return { status: 'OK', message: 'Connection verified' };
	} catch (error) {
		return { status: 'Error', message: (error as Error).message };
	}
}

export async function freedom24UserApiCredentialTest(
	this: ICredentialTestFunctions,
	credential: ICredentialsDecrypted,
): Promise<INodeCredentialTestResult> {
	const login = credential.data?.login as string | undefined;
	const password = credential.data?.password as string | undefined;
	if (!login || !password) {
		return { status: 'Error', message: 'Email/Login and Password are both required' };
	}

	try {
		// eslint-disable-next-line @n8n/community-nodes/no-deprecated-workflow-functions
		const response = (await this.helpers.request({
			method: 'POST',
			uri: `${BASE_URL}/check-login-password`,
			form: { login, password, rememberMe: 1 },
			resolveWithFullResponse: true,
			simple: false,
		})) as { statusCode: number; body: unknown; headers: Record<string, string | string[]> };

		if (response.statusCode !== 200) {
			return { status: 'Error', message: `Freedom24 returned HTTP ${response.statusCode}` };
		}

		const body =
			typeof response.body === 'string' && response.body.length > 0
				? (JSON.parse(response.body) as { error?: string })
				: (response.body as { error?: string } | undefined);
		if (body?.error) {
			return { status: 'Error', message: body.error };
		}

		const setCookie = response.headers['set-cookie'];
		if (!setCookie) {
			return {
				status: 'Error',
				message:
					'Login succeeded but returned no session cookie — this account may require SMS/2FA ' +
					'confirmation, which is not supported by User Login authentication here.',
			};
		}

		return { status: 'OK', message: 'Login verified' };
	} catch (error) {
		return { status: 'Error', message: (error as Error).message };
	}
}
