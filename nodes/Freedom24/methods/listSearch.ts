import { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';

import { AuthContext, makeRequest } from '../transport/request';
import { getSessionId } from '../transport/session';
import { extractRecordArray, RECORD_ARRAY_PATHS } from '../helpers/responses';

async function buildAuthContext(this: ILoadOptionsFunctions): Promise<AuthContext> {
	const authentication = this.getNodeParameter('authentication', 0) as string;
	if (authentication === 'apiKey') {
		const credentials = await this.getCredentials('freedom24Api');
		return {
			type: 'apiKey',
			publicKey: credentials.publicKey as string,
			privateKey: credentials.privateKey as string,
		};
	}
	const credentials = await this.getCredentials('freedom24UserApi');
	const sid = await getSessionId.call(this, credentials.login as string, credentials.password as string);
	return { type: 'userLogin', sid };
}

/** Powers the Ticker field's searchable resourceLocator mode via the tickerFinder command. */
export async function searchTickers(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const auth = await buildAuthContext.call(this);
	const response = await makeRequest.call(
		this,
		'tickerFinder',
		{ text: filter ?? '', limit: 20 },
		auth,
		'auto',
	);
	const found = extractRecordArray(response, RECORD_ARRAY_PATHS.tickerSearch) ?? [];

	return {
		results: found
			.map((entry) => {
				const ticker = typeof entry.c === 'string' ? entry.c : undefined;
				if (!ticker) return null;
				const name = typeof entry.name === 'string' ? entry.name : ticker;
				return { name: `${ticker} — ${name}`, value: ticker };
			})
			.filter((entry): entry is { name: string; value: string } => entry !== null),
	};
}
