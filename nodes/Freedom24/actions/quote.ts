import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';

import { AuthContext, makeRequest } from '../transport/request';
import { extractRecordArray, RECORD_ARRAY_PATHS, unwrapCandlesticks } from '../helpers/responses';
import { intervalToMinutes, splitCsv } from '../helpers/payloads';
import { resolveTickerParam } from '../helpers/ticker';

export async function execute(
	this: IExecuteFunctions,
	i: number,
	operation: string,
	auth: AuthContext,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'get') {
		const ticker = resolveTickerParam(this.getNodeParameter('ticker', i));
		const response = await makeRequest.call(
			this,
			'getStockQuotesJson',
			{ tickers: [ticker] },
			auth,
			'auto',
		);
		const simplify = this.getNodeParameter('simplify', i, true) as boolean;
		if (!simplify) return response;
		const quotes = extractRecordArray(response, RECORD_ARRAY_PATHS.quotes);
		return quotes?.[0] ?? response;
	}

	if (operation === 'getMany') {
		const tickers = splitCsv(this.getNodeParameter('tickers', i) as string);
		const response = await makeRequest.call(this, 'getStockQuotesJson', { tickers }, auth, 'auto');
		const simplify = this.getNodeParameter('simplify', i, true) as boolean;
		if (!simplify) return response;
		return extractRecordArray(response, RECORD_ARRAY_PATHS.quotes) ?? response;
	}

	if (operation === 'getCandlesticks') {
		const ticker = resolveTickerParam(this.getNodeParameter('ticker', i));
		const interval = this.getNodeParameter('interval', i) as string;
		const count = this.getNodeParameter('count', i) as number;
		const response = await makeRequest.call(
			this,
			'getHloc',
			{ id: ticker, timeframe: intervalToMinutes(interval), count },
			auth,
			'auto',
		);
		const simplify = this.getNodeParameter('simplify', i, true) as boolean;
		if (!simplify) return response;
		return unwrapCandlesticks(response, ticker);
	}

	if (operation === 'search') {
		const query = this.getNodeParameter('query', i) as string;
		const limit = this.getNodeParameter('limit', i, 50) as number;
		const response = await makeRequest.call(
			this,
			'tickerFinder',
			{ text: query, limit },
			auth,
			'auto',
		);
		const simplify = this.getNodeParameter('simplify', i, true) as boolean;
		if (!simplify) return response;
		return extractRecordArray(response, RECORD_ARRAY_PATHS.tickerSearch) ?? response;
	}

	throw new NodeOperationError(this.getNode(), `Unknown Quote operation "${operation}"`, {
		itemIndex: i,
	});
}
