import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';

import { AuthContext, makeRequest } from '../transport/request';
import { extractRecordArray, RECORD_ARRAY_PATHS } from '../helpers/responses';
import { buildPlaceOrderPayload, buildUpdateProtectionPayload, splitCsv } from '../helpers/payloads';
import { resolveTickerParam } from '../helpers/ticker';
import { requireConfirmed } from '../helpers/guard';

export async function execute(
	this: IExecuteFunctions,
	i: number,
	operation: string,
	auth: AuthContext,
): Promise<IDataObject | IDataObject[]> {
	const dryRun = this.getNodeParameter('dryRun', i, false) as boolean;
	const confirm = this.getNodeParameter('confirm', i, false) as boolean;

	if (operation === 'getAll') {
		const response = await makeRequest.call(this, 'getNotifyOrderJson', {}, auth, 'auto');
		const simplify = this.getNodeParameter('simplify', i, true) as boolean;
		if (!simplify) return response;
		return extractRecordArray(response, RECORD_ARRAY_PATHS.orders) ?? response;
	}

	if (operation === 'place') {
		const params = buildPlaceOrderPayload({
			ticker: resolveTickerParam(this.getNodeParameter('ticker', i)),
			side: this.getNodeParameter('side', i) as 'buy' | 'sell',
			type: this.getNodeParameter('type', i) as 'market' | 'limit',
			quantity: this.getNodeParameter('quantity', i) as number,
			price: this.getNodeParameter('price', i, 0) as number,
			takeProfit: this.getNodeParameter('takeProfit', i, 0) as number,
			stopLoss: this.getNodeParameter('stopLoss', i, 0) as number,
			stopLossPercent: this.getNodeParameter('stopLossPercent', i, 0) as number,
			trailingPercent: this.getNodeParameter('trailingPercent', i, 0) as number,
			expirationId: this.getNodeParameter('expirationId', i) as number,
		});

		if (dryRun) return { dryRun: true, command: 'putTradeOrder', params };
		requireConfirmed(this.getNode(), i, confirm, 'place a live order');
		return makeRequest.call(this, 'putTradeOrder', params, auth, 'fixedV2');
	}

	if (operation === 'cancel') {
		const params: IDataObject = { order_id: this.getNodeParameter('orderId', i) as string };
		if (dryRun) return { dryRun: true, command: 'delTradeOrder', params };
		requireConfirmed(this.getNode(), i, confirm, 'cancel an order');
		return makeRequest.call(this, 'delTradeOrder', params, auth, 'fixedV1');
	}

	if (operation === 'bulkCancel') {
		const ids = splitCsv(this.getNodeParameter('orderIds', i) as string);
		if (dryRun) {
			return ids.map((orderId) => ({
				dryRun: true,
				command: 'delTradeOrder',
				params: { order_id: orderId },
			}));
		}
		requireConfirmed(this.getNode(), i, confirm, 'bulk cancel orders');

		// Settled independently — one failing cancel must not hide the outcome of the others.
		const settled = await Promise.allSettled(
			ids.map((orderId) => makeRequest.call(this, 'delTradeOrder', { order_id: orderId }, auth, 'fixedV1')),
		);
		return settled.map((outcome, index) =>
			outcome.status === 'fulfilled'
				? { order_id: ids[index], success: true, ...outcome.value }
				: { order_id: ids[index], success: false, error: (outcome.reason as Error).message },
		);
	}

	if (operation === 'updateProtection') {
		const params = buildUpdateProtectionPayload({
			ticker: resolveTickerParam(this.getNodeParameter('ticker', i)),
			takeProfit: this.getNodeParameter('takeProfit', i, 0) as number,
			stopLoss: this.getNodeParameter('stopLoss', i, 0) as number,
			stopLossPercent: this.getNodeParameter('stopLossPercent', i, 0) as number,
			trailingPercent: this.getNodeParameter('trailingPercent', i, 0) as number,
			expirationId: this.getNodeParameter('expirationId', i) as number,
		});

		if (dryRun) return { dryRun: true, command: 'putStopLoss', params };
		requireConfirmed(this.getNode(), i, confirm, 'update order protection');
		return makeRequest.call(this, 'putStopLoss', params, auth, 'fixedV2');
	}

	throw new NodeOperationError(this.getNode(), `Unknown Order operation "${operation}"`, {
		itemIndex: i,
	});
}
