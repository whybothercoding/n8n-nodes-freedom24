import { IDataObject } from 'n8n-workflow';

/**
 * Tradernet answers with HTTP 200 even when a command fails; the failure lives in the JSON
 * body as `error` or `errMsg`. Callers must check this explicitly — the transport layer never
 * sees a non-2xx status for these cases, so nothing else will catch it.
 */
export function getApiError(response: unknown): string | undefined {
	if (!response || typeof response !== 'object') return undefined;
	const obj = response as IDataObject;
	if (typeof obj.error === 'string' && obj.error.length > 0) return obj.error;
	if (typeof obj.errMsg === 'string' && obj.errMsg.length > 0) return obj.errMsg;
	return undefined;
}

export function isCommandNotFound(response: unknown): boolean {
	return getApiError(response) === 'Command not found';
}

function getPath(source: IDataObject, path: string): unknown {
	return path.split('.').reduce<unknown>((acc, key) => {
		if (acc && typeof acc === 'object') return (acc as IDataObject)[key];
		return undefined;
	}, source);
}

/**
 * Tradernet nests list results differently per endpoint (and sometimes per account state).
 * Tries each candidate path in order and returns the first array found. Callers always have a
 * safe fallback (returning the raw envelope as a single item) when nothing matches, so a wrong
 * or incomplete guess here never drops data — it just misses the "one n8n item per record" split.
 */
export function extractRecordArray(
	response: IDataObject,
	candidatePaths: readonly string[],
): IDataObject[] | null {
	for (const path of candidatePaths) {
		const value = getPath(response, path);
		if (Array.isArray(value)) return value as IDataObject[];
	}
	return null;
}

/** Verified against the live API via the freedom-mcp-server reference client. */
export const RECORD_ARRAY_PATHS = {
	quotes: ['quotes.q', 'result.q'],
	orders: ['orders', 'order', 'result.orders', 'result.order', 'result.orders.order', 'result.order.order'],
	watchlists: ['userStockLists', 'lists'],
	tickerSearch: ['found'],
} as const;

export function unwrapPortfolio(response: IDataObject): IDataObject {
	const opq = response.OPQ as IDataObject | undefined;
	return (opq?.ps as IDataObject | undefined) ?? { loaded: false, acc: [], pos: [] };
}

/**
 * Candlesticks are keyed by ticker in some response shapes and flat in others. Tries each shape;
 * falls back to an empty array (never throws) since a caller can still surface the raw envelope.
 */
export function unwrapCandlesticks(response: IDataObject, ticker: string): IDataObject[] {
	const tryExtract = (data: unknown): IDataObject[] | null => {
		if (Array.isArray(data)) return data as IDataObject[];
		if (data && typeof data === 'object' && Array.isArray((data as IDataObject)[ticker])) {
			return (data as IDataObject)[ticker] as IDataObject[];
		}
		return null;
	};

	const result = response.result as IDataObject | undefined;
	return (
		tryExtract(response[ticker]) ??
		tryExtract(response.hloc) ??
		tryExtract(result?.hloc) ??
		tryExtract(result?.[ticker]) ??
		[]
	);
}
