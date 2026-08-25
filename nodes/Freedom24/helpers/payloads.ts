import { IDataObject } from 'n8n-workflow';

/**
 * Pure payload builders for every mutating (and a couple of read) Tradernet commands. None of
 * these touch IExecuteFunctions — they take plain parameter objects and return the exact request
 * body, which is what makes them directly unit-testable without mocking n8n's execution context.
 * The actions/*.ts layer is the only thing that reads node parameters and calls these.
 */

export class PayloadValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'PayloadValidationError';
	}
}

/** Comma-separated UI fields (tickers, order IDs, currencies) all split the same way. */
export function splitCsv(value: string): string[] {
	if (!value) return [];
	return value
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

export const INTERVAL_TO_MINUTES: Record<string, number> = {
	'1M': 1,
	'5M': 5,
	'15M': 15,
	'30M': 30,
	'1H': 60,
	'4H': 240,
	'1D': 1440,
	'1W': 10080,
};

export function intervalToMinutes(interval: string): number {
	return INTERVAL_TO_MINUTES[interval] ?? INTERVAL_TO_MINUTES['1D'];
}

/**
 * n8n's dateTime picker serializes to a UTC ISO string, which can carry a different calendar date
 * than the one the user actually picked once shifted back to their own timezone (e.g. 11pm local
 * in a UTC+ zone rolls over to the next UTC day). A plain `.split('T')[0]` on that UTC string would
 * silently send Tradernet the wrong day, so the caller passes the workflow's configured timezone
 * (this.getTimezone()) and this reformats the date within it instead. Falls back to the naive split
 * for a value that doesn't parse as a date (e.g. already a bare "YYYY-MM-DD").
 */
export function toApiDateString(isoDateTime: string, timezone: string): string {
	const date = new Date(isoDateTime);
	if (Number.isNaN(date.getTime())) return isoDateTime.split('T')[0] ?? isoDateTime;
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(date);
}

export interface PlaceOrderParams {
	ticker: string;
	side: 'buy' | 'sell';
	type: 'market' | 'limit';
	quantity: number;
	price?: number;
	takeProfit?: number;
	stopLoss?: number;
	stopLossPercent?: number;
	trailingPercent?: number;
	expirationId: number;
}

export function buildPlaceOrderPayload(params: PlaceOrderParams): IDataObject {
	if (params.type === 'limit' && !(params.price && params.price > 0)) {
		throw new PayloadValidationError('Limit orders require a Price greater than 0.');
	}

	const payload: IDataObject = {
		instr_name: params.ticker,
		action_id: params.side === 'buy' ? 1 : 3,
		order_type_id: params.type === 'market' ? 1 : 2,
		qty: params.quantity,
	};

	if (params.type === 'limit') payload.limit_price = params.price;
	if (params.takeProfit && params.takeProfit > 0) payload.take_profit = params.takeProfit;
	if (params.stopLoss && params.stopLoss > 0) payload.stop_loss = params.stopLoss;
	if (params.stopLossPercent && params.stopLossPercent > 0)
		payload.stop_loss_percent = params.stopLossPercent;
	if (params.trailingPercent && params.trailingPercent > 0)
		payload.stoploss_trailing_percent = params.trailingPercent;
	payload.expiration_id = params.expirationId;

	return payload;
}

export interface UpdateProtectionParams {
	ticker: string;
	takeProfit?: number;
	stopLoss?: number;
	stopLossPercent?: number;
	trailingPercent?: number;
	expirationId: number;
}

export function buildUpdateProtectionPayload(params: UpdateProtectionParams): IDataObject {
	const payload: IDataObject = { instr_name: params.ticker, expiration_id: params.expirationId };
	if (params.takeProfit && params.takeProfit > 0) payload.take_profit = params.takeProfit;
	if (params.stopLoss && params.stopLoss > 0) payload.stop_loss = params.stopLoss;
	if (params.stopLossPercent && params.stopLossPercent > 0)
		payload.stop_loss_percent = params.stopLossPercent;
	if (params.trailingPercent && params.trailingPercent > 0)
		payload.stoploss_trailing_percent = params.trailingPercent;
	return payload;
}

export interface WatchlistCreateParams {
	name: string;
	tickers: string[];
	picture?: string;
}

export function buildWatchlistCreatePayload(params: WatchlistCreateParams): IDataObject {
	const payload: IDataObject = { name: params.name, tickers: params.tickers };
	if (params.picture) payload.picture = params.picture;
	return payload;
}

export interface WatchlistUpdateParams {
	listId: number;
	name?: string;
	picture?: string;
	index?: number;
}

export function buildWatchlistUpdatePayload(params: WatchlistUpdateParams): IDataObject {
	// `index` is a UI number field (default 0) — it is never actually undefined once read from the
	// node, so it is always sent. Do not gate it behind `!== undefined`: that used to be dead code
	// masking the fact every update silently repositions the list to `index` (0 by default).
	const payload: IDataObject = { id: params.listId, index: params.index ?? 0 };
	if (params.name) payload.name = params.name;
	if (params.picture) payload.picture = params.picture;
	return payload;
}

export interface WatchlistTickerParams {
	listId: number;
	ticker: string;
	index?: number;
}

export function buildAddTickerPayload(params: WatchlistTickerParams): IDataObject {
	return { id: params.listId, ticker: params.ticker, index: params.index ?? 0 };
}

export function buildRemoveTickerPayload(params: WatchlistTickerParams): IDataObject {
	return { id: params.listId, ticker: params.ticker };
}

export type ToggleAlertParams =
	| {
			mode: 'create';
			ticker: string;
			price: number;
			triggerType: string;
			quoteType: string;
			notificationType: string;
			alertPeriod: number;
			expire: number;
	  }
	| {
			mode: 'delete';
			alertId: number;
			quoteType: string;
			notificationType: string;
	  };

export function buildToggleAlertPayload(params: ToggleAlertParams): IDataObject {
	const payload: IDataObject = {
		quote_type: params.quoteType,
		notification_type: params.notificationType,
	};

	if (params.mode === 'delete') {
		payload.id = params.alertId;
		payload.del = true;
		return payload;
	}

	payload.ticker = params.ticker;
	payload.price = { price: String(params.price) };
	payload.trigger_type = params.triggerType;
	payload.alert_period = params.alertPeriod;
	payload.expire = params.expire;
	return payload;
}

export interface CashflowsParams {
	userId?: number;
	groupByType: boolean;
	cashTotals: boolean;
	hideLimits: boolean;
	take: number;
	skip: number;
	withoutRefund: boolean;
	filters?: unknown[];
	sort?: unknown[];
}

export function buildCashflowsPayload(params: CashflowsParams): IDataObject {
	const payload: IDataObject = {
		groupByType: params.groupByType ? 1 : 0,
		cash_totals: params.cashTotals ? 1 : 0,
		hide_limits: params.hideLimits ? 1 : 0,
		take: params.take,
		skip: params.skip,
		without_refund: params.withoutRefund ? 1 : 0,
	};
	if (params.userId && params.userId > 0) payload.user_id = params.userId;
	if (params.filters && params.filters.length > 0) payload.filters = params.filters;
	if (params.sort && params.sort.length > 0) payload.sort = params.sort;
	return payload;
}

export interface TradesHistoryParams {
	from: string;
	till: string;
	timezone: string;
	tradeId?: number;
	maxResults?: number;
	ticker?: string;
	currency?: string;
	receptionId?: number;
}

export function buildTradesHistoryPayload(params: TradesHistoryParams): IDataObject {
	const payload: IDataObject = {
		beginDate: toApiDateString(params.from, params.timezone),
		endDate: toApiDateString(params.till, params.timezone),
	};
	if (params.tradeId && params.tradeId > 0) payload.tradeId = params.tradeId;
	if (params.maxResults && params.maxResults > 0) payload.max = params.maxResults;
	if (params.ticker) payload.nt_ticker = params.ticker;
	if (params.currency) payload.curr = params.currency;
	if (params.receptionId && params.receptionId > 0) payload.reception = params.receptionId;
	return payload;
}

export interface SecuritiesQueryParams {
	take: number;
	skip: number;
	filters?: unknown[];
	sort?: unknown[];
}

export function buildSecuritiesQueryPayload(params: SecuritiesQueryParams): IDataObject {
	const payload: IDataObject = { take: params.take, skip: params.skip };
	if (params.filters && params.filters.length > 0) payload.filter = { filters: params.filters };
	if (params.sort && params.sort.length > 0) payload.sort = params.sort;
	return payload;
}

export interface FxRatesParams {
	baseCurrency: string;
	currencies: string[];
	timezone: string;
	fxDate?: string;
}

export function buildFxRatesPayload(params: FxRatesParams): IDataObject {
	const payload: IDataObject = {
		base_currency: params.baseCurrency,
		currencies: params.currencies,
	};
	if (params.fxDate) payload.date = toApiDateString(params.fxDate, params.timezone);
	return payload;
}
