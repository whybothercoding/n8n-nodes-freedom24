import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';

import { AuthContext, makeRequest } from '../transport/request';

export async function execute(
	this: IExecuteFunctions,
	i: number,
	operation: string,
	auth: AuthContext,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'getStatus') {
		const mode = this.getNodeParameter('marketMode', i, '') as string;
		const params: IDataObject = { market: '*' };
		if (mode) params.mode = mode;
		return makeRequest.call(this, 'getMarketStatus', params, auth, 'auto');
	}
	throw new NodeOperationError(this.getNode(), `Unknown Market operation "${operation}"`, {
		itemIndex: i,
	});
}
