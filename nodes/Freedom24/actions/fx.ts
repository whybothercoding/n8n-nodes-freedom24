import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';

import { AuthContext, makeRequest } from '../transport/request';
import { buildFxRatesPayload, splitCsv } from '../helpers/payloads';

export async function execute(
	this: IExecuteFunctions,
	i: number,
	operation: string,
	auth: AuthContext,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'getRates') {
		const params = buildFxRatesPayload({
			baseCurrency: this.getNodeParameter('baseCurrency', i) as string,
			currencies: splitCsv(this.getNodeParameter('currencies', i) as string),
			fxDate: this.getNodeParameter('fxDate', i, '') as string,
		});
		return makeRequest.call(this, 'getCrossRatesForDate', params, auth, 'auto');
	}
	throw new NodeOperationError(this.getNode(), `Unknown FX operation "${operation}"`, {
		itemIndex: i,
	});
}
