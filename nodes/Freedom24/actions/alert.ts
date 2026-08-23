import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';

import { AuthContext, makeRequest } from '../transport/request';
import { buildToggleAlertPayload } from '../helpers/payloads';
import { resolveTickerParam } from '../helpers/ticker';
import { requireConfirmed } from '../helpers/guard';

export async function execute(
	this: IExecuteFunctions,
	i: number,
	operation: string,
	auth: AuthContext,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'getAll') {
		const triggered = this.getNodeParameter('triggered', i, false) as boolean;
		const ticker = resolveTickerParam(this.getNodeParameter('ticker', i, ''));
		const params: IDataObject = { triggered };
		if (ticker) params.ticker = ticker;
		return makeRequest.call(this, 'getAlertsList', params, auth, 'auto');
	}

	if (operation === 'toggle') {
		const del = this.getNodeParameter('deleteAlert', i, false) as boolean;
		const quoteType = this.getNodeParameter('quoteType', i) as string;
		const notificationType = this.getNodeParameter('notificationType', i) as string;

		const params = buildToggleAlertPayload(
			del
				? {
						mode: 'delete',
						alertId: this.getNodeParameter('alertId', i) as number,
						quoteType,
						notificationType,
					}
				: {
						mode: 'create',
						ticker: resolveTickerParam(this.getNodeParameter('ticker', i)),
						price: this.getNodeParameter('price', i) as number,
						triggerType: this.getNodeParameter('triggerType', i) as string,
						quoteType,
						notificationType,
						alertPeriod: this.getNodeParameter('alertPeriod', i) as number,
						expire: this.getNodeParameter('expire', i) as number,
					},
		);

		const dryRun = this.getNodeParameter('dryRun', i, false) as boolean;
		if (dryRun) return { dryRun: true, command: 'togglePriceAlert', params };
		requireConfirmed(
			this.getNode(),
			i,
			this.getNodeParameter('confirm', i, false) as boolean,
			del ? 'delete an alert' : 'create an alert',
		);
		return makeRequest.call(this, 'togglePriceAlert', params, auth, 'fixedV1');
	}

	throw new NodeOperationError(this.getNode(), `Unknown Alert operation "${operation}"`, {
		itemIndex: i,
	});
}
