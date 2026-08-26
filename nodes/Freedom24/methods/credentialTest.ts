import { ICredentialsDecrypted, ICredentialTestFunctions, INodeCredentialTestResult } from 'n8n-workflow';

import { parseBody } from '../transport/request';
import { getApiError } from '../helpers/responses';

const BASE_URL = 'https://tradernet.com/api';

/**
 * Freedom24Api's credential test is declarative now (see Freedom24Api.credentials.ts's `test` +
 * `authenticate`) — Tradernet returns a real HTTP 403 for a bad API key/signature, so the
 * default non-2xx check is a genuine test with no need for this file's custom probe.
 *
 * User Login can't do the same: Tradernet returns HTTP 200 even for a wrong login/password, with
 * a session cookie issued either way — verified against the live API 2026-08-26. The only
 * reliable failure signal is the `error` key in the response body, which a declarative
 * `ICredentialTestRequest`'s `rules` can't express (it only matches a status code or an exact
 * body key/value against a known-good shape). This one stays a real signed/authenticated probe.
 */
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

		const body = parseBody(response.body);
		const apiError = getApiError(body);
		if (apiError) {
			return { status: 'Error', message: apiError };
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
