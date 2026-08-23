import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';

import { AuthContext } from '../transport/request';
import { PayloadValidationError } from '../helpers/payloads';
import { JsonParamParseError } from '../helpers/parse';

import * as portfolio from './portfolio';
import * as quote from './quote';
import * as order from './order';
import * as market from './market';
import * as watchlist from './watchlist';
import * as security from './security';
import * as history from './history';
import * as alert from './alert';
import * as fx from './fx';
import * as dynamic from './dynamic';

type ResourceHandler = typeof portfolio.execute;

const RESOURCE_HANDLERS: Record<string, ResourceHandler> = {
	portfolio: portfolio.execute,
	quote: quote.execute,
	order: order.execute,
	market: market.execute,
	watchlist: watchlist.execute,
	security: security.execute,
	history: history.execute,
	alert: alert.execute,
	fx: fx.execute,
	dynamic: dynamic.execute,
};

/**
 * Single dispatch point for every resource, and the one place that translates the pure helpers'
 * domain errors (PayloadValidationError, JsonParamParseError) into a proper NodeOperationError
 * carrying itemIndex. Pure builders can't build that error themselves — they never touch
 * IExecuteFunctions — so this is where that seam gets closed.
 */
export async function router(
	this: IExecuteFunctions,
	i: number,
	auth: AuthContext,
): Promise<IDataObject | IDataObject[]> {
	const resource = this.getNodeParameter('resource', i) as string;
	const operation = this.getNodeParameter('operation', i) as string;

	const handler = RESOURCE_HANDLERS[resource];
	if (!handler) {
		throw new NodeOperationError(this.getNode(), `Unknown resource "${resource}"`, {
			itemIndex: i,
		});
	}

	try {
		return await handler.call(this, i, operation, auth);
	} catch (error) {
		if (error instanceof PayloadValidationError || error instanceof JsonParamParseError) {
			throw new NodeOperationError(this.getNode(), error.message, { itemIndex: i });
		}
		throw error;
	}
}
