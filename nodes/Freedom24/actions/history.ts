import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';

import { AuthContext, makeRequest } from '../transport/request';
import { buildCashflowsPayload, buildTradesHistoryPayload } from '../helpers/payloads';
import { parseJsonParam } from '../helpers/parse';
import { resolveTickerParam } from '../helpers/ticker';

export async function execute(
	this: IExecuteFunctions,
	i: number,
	operation: string,
	auth: AuthContext,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'getOrders') {
		// from/till are only ever read here — they aren't displayed for getCashflows, so reading
		// them unconditionally for the whole "history" resource would read a parameter n8n never
		// persisted for that operation.
		const from = this.getNodeParameter('from', i) as string;
		const till = this.getNodeParameter('till', i) as string;
		return makeRequest.call(this, 'getOrdersHistory', { from, till }, auth, 'auto');
	}

	if (operation === 'getTrades') {
		const from = this.getNodeParameter('from', i) as string;
		const till = this.getNodeParameter('till', i) as string;
		const params = buildTradesHistoryPayload({
			from,
			till,
			tradeId: this.getNodeParameter('tradeId', i, 0) as number,
			maxResults: this.getNodeParameter('maxResults', i, 0) as number,
			ticker: resolveTickerParam(this.getNodeParameter('ticker', i, '')),
			currency: this.getNodeParameter('currency', i, '') as string,
			receptionId: this.getNodeParameter('receptionId', i, 0) as number,
		});
		return makeRequest.call(this, 'getTradesHistory', params, auth, 'auto');
	}

	if (operation === 'getCashflows') {
		const filters = parseJsonParam<unknown[]>(
			'filtersJson',
			this.getNodeParameter('filtersJson', i, '[]') as string,
		);
		const sort = parseJsonParam<unknown[]>(
			'sortJson',
			this.getNodeParameter('sortJson', i, '[]') as string,
		);
		const params = buildCashflowsPayload({
			userId: this.getNodeParameter('userId', i, 0) as number,
			groupByType: this.getNodeParameter('groupByType', i, false) as boolean,
			cashTotals: this.getNodeParameter('cashTotals', i, false) as boolean,
			hideLimits: this.getNodeParameter('hideLimits', i, false) as boolean,
			take: this.getNodeParameter('take', i, 50) as number,
			skip: this.getNodeParameter('skip', i, 0) as number,
			withoutRefund: this.getNodeParameter('withoutRefund', i, false) as boolean,
			filters,
			sort,
		});
		return makeRequest.call(this, 'getUserCashFlows', params, auth, 'auto');
	}

	throw new NodeOperationError(this.getNode(), `Unknown History operation "${operation}"`, {
		itemIndex: i,
	});
}
