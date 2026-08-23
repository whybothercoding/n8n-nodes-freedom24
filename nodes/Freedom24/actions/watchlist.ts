import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';

import { AuthContext, makeRequest } from '../transport/request';
import { extractRecordArray, RECORD_ARRAY_PATHS } from '../helpers/responses';
import {
	buildAddTickerPayload,
	buildRemoveTickerPayload,
	buildWatchlistCreatePayload,
	buildWatchlistUpdatePayload,
	splitCsv,
} from '../helpers/payloads';
import { resolveTickerParam } from '../helpers/ticker';
import { requireConfirmed } from '../helpers/guard';

async function backfillFromCurrent(
	this: IExecuteFunctions,
	auth: AuthContext,
	listId: number,
	name: string,
	picture: string,
): Promise<{ name?: string; picture?: string }> {
	if (name && picture) return { name, picture };

	// Tradernet can reject updateStockList if name/picture are omitted, even when unchanged — back
	// them off the current record so "leave blank to keep the current value" actually works.
	const listsResponse = await makeRequest.call(this, 'getUserStockLists', {}, auth, 'auto');
	const lists = extractRecordArray(listsResponse, RECORD_ARRAY_PATHS.watchlists) ?? [];
	const current = lists.find((list) => (list as IDataObject).id === listId) as
		| IDataObject
		| undefined;

	return {
		name: name || (typeof current?.name === 'string' ? current.name : undefined),
		picture: picture || (typeof current?.picture === 'string' ? current.picture : undefined),
	};
}

export async function execute(
	this: IExecuteFunctions,
	i: number,
	operation: string,
	auth: AuthContext,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'getAll') {
		const response = await makeRequest.call(this, 'getUserStockLists', {}, auth, 'auto');
		const simplify = this.getNodeParameter('simplify', i, true) as boolean;
		if (!simplify) return response;
		return extractRecordArray(response, RECORD_ARRAY_PATHS.watchlists) ?? response;
	}

	const dryRun = this.getNodeParameter('dryRun', i, false) as boolean;
	const confirm = this.getNodeParameter('confirm', i, false) as boolean;

	if (operation === 'create') {
		const params = buildWatchlistCreatePayload({
			name: this.getNodeParameter('name', i) as string,
			tickers: splitCsv(this.getNodeParameter('tickers', i, '') as string),
			picture: this.getNodeParameter('picture', i, '') as string,
		});
		if (dryRun) return { dryRun: true, command: 'addStockList', params };
		requireConfirmed(this.getNode(), i, confirm, 'create a watchlist');
		return makeRequest.call(this, 'addStockList', params, auth, 'fixedV1');
	}

	if (operation === 'update') {
		const listId = this.getNodeParameter('listId', i) as number;
		const { name, picture } = await backfillFromCurrent.call(
			this,
			auth,
			listId,
			this.getNodeParameter('name', i, '') as string,
			this.getNodeParameter('picture', i, '') as string,
		);
		const params = buildWatchlistUpdatePayload({
			listId,
			name,
			picture,
			index: this.getNodeParameter('index', i, 0) as number,
		});
		if (dryRun) return { dryRun: true, command: 'updateStockList', params };
		requireConfirmed(this.getNode(), i, confirm, 'update a watchlist');
		return makeRequest.call(this, 'updateStockList', params, auth, 'fixedV1');
	}

	if (operation === 'delete') {
		const params: IDataObject = { id: this.getNodeParameter('listId', i) as number };
		if (dryRun) return { dryRun: true, command: 'deleteStockList', params };
		requireConfirmed(this.getNode(), i, confirm, 'delete a watchlist');
		return makeRequest.call(this, 'deleteStockList', params, auth, 'fixedV1');
	}

	if (operation === 'select') {
		const params: IDataObject = { id: this.getNodeParameter('listId', i) as number };
		if (dryRun) return { dryRun: true, command: 'makeStockListSelected', params };
		requireConfirmed(this.getNode(), i, confirm, 'change the active watchlist');
		return makeRequest.call(this, 'makeStockListSelected', params, auth, 'fixedV1');
	}

	if (operation === 'addTicker') {
		const params = buildAddTickerPayload({
			listId: this.getNodeParameter('listId', i) as number,
			ticker: resolveTickerParam(this.getNodeParameter('ticker', i)),
			index: this.getNodeParameter('index', i, 0) as number,
		});
		if (dryRun) return { dryRun: true, command: 'addStockListTicker', params };
		requireConfirmed(this.getNode(), i, confirm, 'add a ticker to a watchlist');
		return makeRequest.call(this, 'addStockListTicker', params, auth, 'fixedV1');
	}

	if (operation === 'removeTicker') {
		const params = buildRemoveTickerPayload({
			listId: this.getNodeParameter('listId', i) as number,
			ticker: resolveTickerParam(this.getNodeParameter('ticker', i)),
		});
		if (dryRun) return { dryRun: true, command: 'deleteStockListTicker', params };
		requireConfirmed(this.getNode(), i, confirm, 'remove a ticker from a watchlist');
		return makeRequest.call(this, 'deleteStockListTicker', params, auth, 'fixedV1');
	}

	throw new NodeOperationError(this.getNode(), `Unknown Watchlist operation "${operation}"`, {
		itemIndex: i,
	});
}
