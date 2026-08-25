import { IExecuteFunctions, IDataObject, JsonObject, NodeApiError, NodeOperationError } from 'n8n-workflow';

import { AuthContext } from '../transport/request';
import { PayloadValidationError } from '../helpers/payloads';

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
 * Single dispatch point for every resource, and the one place that translates the pure payload
 * builders' domain error (PayloadValidationError) into a proper NodeOperationError carrying
 * itemIndex. Pure builders can't build that error themselves — they never touch
 * IExecuteFunctions — so this is where that seam gets closed.
 *
 * Anything else escaping a handler should already be a NodeApiError (from makeRequest) or a
 * NodeOperationError (from a confirm-gate, an unmatched operation, or a parameter-parsing
 * failure) — constructing a fresh NodeApiError around it is a no-op passthrough for the
 * NodeApiError case (its constructor returns an already-NodeApiError argument unchanged) and a
 * message/description-preserving rewrap for everything else, which is what
 * `@n8n/community-nodes/require-node-api-error` expects instead of a bare rethrow.
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
		if (error instanceof PayloadValidationError) {
			throw new NodeOperationError(this.getNode(), error.message, { itemIndex: i });
		}
		throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
	}
}
