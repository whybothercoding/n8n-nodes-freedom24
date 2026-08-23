import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';

import { AuthContext, makeRequest } from '../transport/request';
import { unwrapPortfolio } from '../helpers/responses';

export async function execute(
	this: IExecuteFunctions,
	i: number,
	operation: string,
	auth: AuthContext,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'getAll') {
		const response = await makeRequest.call(this, 'getOPQ', {}, auth, 'auto');
		const simplify = this.getNodeParameter('simplify', i, true) as boolean;
		return simplify ? unwrapPortfolio(response) : response;
	}
	throw new NodeOperationError(this.getNode(), `Unknown Portfolio operation "${operation}"`, {
		itemIndex: i,
	});
}
