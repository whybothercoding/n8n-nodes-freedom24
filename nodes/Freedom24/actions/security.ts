import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';

import { AuthContext, makeRequest } from '../transport/request';
import { buildSecuritiesQueryPayload } from '../helpers/payloads';
import { parseJsonArrayParam } from '../helpers/parse';
import { resolveTickerParam } from '../helpers/ticker';

export async function execute(
	this: IExecuteFunctions,
	i: number,
	operation: string,
	auth: AuthContext,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'getInfo') {
		const ticker = resolveTickerParam(this.getNodeParameter('ticker', i));
		return makeRequest.call(this, 'getSecurityInfo', { ticker, sup: true }, auth, 'auto');
	}

	if (operation === 'getAll') {
		const filters = parseJsonArrayParam(
			this.getNode(),
			i,
			'filtersJson',
			this.getNodeParameter('filtersJson', i, '[]') as string,
		);
		const sort = parseJsonArrayParam(
			this.getNode(),
			i,
			'sortJson',
			this.getNodeParameter('sortJson', i, '[]') as string,
		);
		const params = buildSecuritiesQueryPayload({
			take: this.getNodeParameter('take', i, 50) as number,
			skip: this.getNodeParameter('skip', i, 0) as number,
			filters,
			sort,
		});
		return makeRequest.call(this, 'getAllSecurities', params, auth, 'auto');
	}

	if (operation === 'getTop') {
		const limit = this.getNodeParameter('limit', i, 10) as number;
		return makeRequest.call(this, 'getTopSecurities', { limit }, auth, 'auto');
	}

	throw new NodeOperationError(this.getNode(), `Unknown Security operation "${operation}"`, {
		itemIndex: i,
	});
}
