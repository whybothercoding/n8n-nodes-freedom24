/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, expect, it } from 'vitest';

import {
	PayloadValidationError,
	buildAddTickerPayload,
	buildCashflowsPayload,
	buildFxRatesPayload,
	buildPlaceOrderPayload,
	buildRemoveTickerPayload,
	buildSecuritiesQueryPayload,
	buildToggleAlertPayload,
	buildTradesHistoryPayload,
	buildUpdateProtectionPayload,
	buildWatchlistCreatePayload,
	buildWatchlistUpdatePayload,
	intervalToMinutes,
	splitCsv,
	toApiDateString,
} from '../../nodes/Freedom24/helpers/payloads';

describe('splitCsv', () => {
	it('trims and drops empty entries', () => {
		expect(splitCsv('AAPL.US, MSFT.US ,, ')).toEqual(['AAPL.US', 'MSFT.US']);
	});

	it('returns an empty array for an empty string', () => {
		expect(splitCsv('')).toEqual([]);
	});
});

describe('intervalToMinutes', () => {
	it('maps every supported interval', () => {
		expect(intervalToMinutes('1M')).toBe(1);
		expect(intervalToMinutes('1D')).toBe(1440);
		expect(intervalToMinutes('1W')).toBe(10080);
	});

	it('falls back to 1D for an unknown interval', () => {
		expect(intervalToMinutes('bogus')).toBe(1440);
	});
});

describe('buildPlaceOrderPayload', () => {
	it('builds a market order with only the required fields', () => {
		const payload = buildPlaceOrderPayload({
			ticker: 'AAPL.US',
			side: 'buy',
			type: 'market',
			quantity: 10,
			expirationId: 3,
		});
		expect(payload).toEqual({
			instr_name: 'AAPL.US',
			action_id: 1,
			order_type_id: 1,
			qty: 10,
			expiration_id: 3,
		});
	});

	it('maps sell to action_id 3', () => {
		const payload = buildPlaceOrderPayload({
			ticker: 'AAPL.US',
			side: 'sell',
			type: 'market',
			quantity: 1,
			expirationId: 3,
		});
		expect(payload.action_id).toBe(3);
	});

	it('includes limit_price for a valid limit order', () => {
		const payload = buildPlaceOrderPayload({
			ticker: 'AAPL.US',
			side: 'buy',
			type: 'limit',
			quantity: 1,
			price: 150,
			expirationId: 3,
		});
		expect(payload.order_type_id).toBe(2);
		expect(payload.limit_price).toBe(150);
	});

	it('rejects a limit order with no price', () => {
		expect(() =>
			buildPlaceOrderPayload({
				ticker: 'AAPL.US',
				side: 'buy',
				type: 'limit',
				quantity: 1,
				expirationId: 3,
			}),
		).toThrow(PayloadValidationError);
	});

	it('rejects a limit order with price 0', () => {
		expect(() =>
			buildPlaceOrderPayload({
				ticker: 'AAPL.US',
				side: 'buy',
				type: 'limit',
				quantity: 1,
				price: 0,
				expirationId: 3,
			}),
		).toThrow(PayloadValidationError);
	});

	it('does not require a price for a market order', () => {
		expect(() =>
			buildPlaceOrderPayload({
				ticker: 'AAPL.US',
				side: 'buy',
				type: 'market',
				quantity: 1,
				expirationId: 3,
			}),
		).not.toThrow();
	});

	it('only includes protection fields that are set and positive', () => {
		const payload = buildPlaceOrderPayload({
			ticker: 'AAPL.US',
			side: 'buy',
			type: 'market',
			quantity: 1,
			takeProfit: 200,
			stopLoss: 0,
			stopLossPercent: -5,
			trailingPercent: 3,
			expirationId: 3,
		});
		expect(payload.take_profit).toBe(200);
		expect(payload.stoploss_trailing_percent).toBe(3);
		expect(payload).not.toHaveProperty('stop_loss');
		expect(payload).not.toHaveProperty('stop_loss_percent');
	});
});

describe('buildUpdateProtectionPayload', () => {
	it('always sends instr_name and expiration_id', () => {
		const payload = buildUpdateProtectionPayload({ ticker: 'AAPL.US', expirationId: 3 });
		expect(payload).toEqual({ instr_name: 'AAPL.US', expiration_id: 3 });
	});

	it('includes only positive protection values', () => {
		const payload = buildUpdateProtectionPayload({
			ticker: 'AAPL.US',
			expirationId: 3,
			stopLoss: 100,
			takeProfit: 0,
		});
		expect(payload.stop_loss).toBe(100);
		expect(payload).not.toHaveProperty('take_profit');
	});
});

describe('watchlist payload builders', () => {
	it('buildWatchlistCreatePayload omits picture when blank', () => {
		expect(buildWatchlistCreatePayload({ name: 'Tech', tickers: ['AAPL.US'] })).toEqual({
			name: 'Tech',
			tickers: ['AAPL.US'],
		});
	});

	it('buildWatchlistCreatePayload includes picture when set', () => {
		expect(
			buildWatchlistCreatePayload({ name: 'Tech', tickers: [], picture: '📈' }),
		).toEqual({ name: 'Tech', tickers: [], picture: '📈' });
	});

	it('buildWatchlistUpdatePayload always sends index, even 0', () => {
		const payload = buildWatchlistUpdatePayload({ listId: 42, index: 0 });
		expect(payload).toEqual({ id: 42, index: 0 });
	});

	it('buildWatchlistUpdatePayload includes name/picture only when provided', () => {
		const payload = buildWatchlistUpdatePayload({ listId: 42, index: 2, name: 'Renamed' });
		expect(payload).toEqual({ id: 42, index: 2, name: 'Renamed' });
	});

	it('buildAddTickerPayload defaults index to 0 and always sends it', () => {
		expect(buildAddTickerPayload({ listId: 1, ticker: 'AAPL.US' })).toEqual({
			id: 1,
			ticker: 'AAPL.US',
			index: 0,
		});
	});

	it('buildRemoveTickerPayload has no index', () => {
		expect(buildRemoveTickerPayload({ listId: 1, ticker: 'AAPL.US' })).toEqual({
			id: 1,
			ticker: 'AAPL.US',
		});
	});
});

describe('buildToggleAlertPayload', () => {
	it('builds a create payload with price wrapped as a stringified object', () => {
		const payload = buildToggleAlertPayload({
			mode: 'create',
			ticker: 'AAPL.US',
			price: 150.5,
			triggerType: 'last_more',
			quoteType: 'ltp',
			notificationType: 'email',
			alertPeriod: 0,
			expire: 0,
		});
		expect(payload).toEqual({
			quote_type: 'ltp',
			notification_type: 'email',
			ticker: 'AAPL.US',
			price: { price: '150.5' },
			trigger_type: 'last_more',
			alert_period: 0,
			expire: 0,
		});
	});

	it('builds a delete payload with del: true', () => {
		const payload = buildToggleAlertPayload({
			mode: 'delete',
			alertId: 7,
			quoteType: 'ltp',
			notificationType: 'email',
		});
		expect(payload).toEqual({
			quote_type: 'ltp',
			notification_type: 'email',
			id: 7,
			del: true,
		});
	});
});

describe('buildCashflowsPayload', () => {
	it('maps booleans to 1/0 and omits zero/empty optional fields', () => {
		const payload = buildCashflowsPayload({
			groupByType: true,
			cashTotals: false,
			hideLimits: true,
			take: 50,
			skip: 0,
			withoutRefund: false,
		});
		expect(payload).toEqual({
			groupByType: 1,
			cash_totals: 0,
			hide_limits: 1,
			take: 50,
			skip: 0,
			without_refund: 0,
		});
	});

	it('includes userId/filters/sort only when meaningfully set', () => {
		const payload = buildCashflowsPayload({
			groupByType: false,
			cashTotals: false,
			hideLimits: false,
			take: 50,
			skip: 0,
			withoutRefund: false,
			userId: 99,
			filters: [{ field: 'type', operator: 'eq', value: 'dividend' }],
			sort: [],
		});
		expect(payload.user_id).toBe(99);
		expect(payload.filters).toHaveLength(1);
		expect(payload).not.toHaveProperty('sort');
	});
});

describe('toApiDateString', () => {
	it('takes the date-only portion of a UTC ISO datetime under the UTC timezone', () => {
		expect(toApiDateString('2026-01-01T00:00:00.000Z', 'UTC')).toBe('2026-01-01');
	});

	it('shifts to the correct local calendar date for a non-UTC timezone', () => {
		// 2026-01-01T23:30:00Z is already 2026-01-02 in UTC+1 — the naive .split('T')[0] this
		// replaces would have wrongly reported 2026-01-01.
		expect(toApiDateString('2026-01-01T23:30:00.000Z', 'Europe/Athens')).toBe('2026-01-02');
	});

	it('falls back to a naive split for a value Date cannot parse', () => {
		expect(toApiDateString('not-a-date', 'UTC')).toBe('not-a-date');
	});
});

describe('buildTradesHistoryPayload', () => {
	it('takes the date-only portion of ISO datetimes', () => {
		const payload = buildTradesHistoryPayload({
			from: '2026-01-01T00:00:00.000Z',
			till: '2026-01-31T23:59:59.000Z',
			timezone: 'UTC',
		});
		expect(payload).toEqual({ beginDate: '2026-01-01', endDate: '2026-01-31' });
	});

	it('resolves the date in the given timezone, not UTC', () => {
		const payload = buildTradesHistoryPayload({
			from: '2026-01-01T23:30:00.000Z',
			till: '2026-01-31T23:59:59.000Z',
			timezone: 'Europe/Athens',
		});
		expect(payload.beginDate).toBe('2026-01-02');
	});

	it('includes optional filters only when set', () => {
		const payload = buildTradesHistoryPayload({
			from: '2026-01-01',
			till: '2026-01-31',
			timezone: 'UTC',
			ticker: 'AAPL.US',
			receptionId: 0,
			tradeId: 0,
		});
		expect(payload).toEqual({
			beginDate: '2026-01-01',
			endDate: '2026-01-31',
			nt_ticker: 'AAPL.US',
		});
	});
});

describe('buildSecuritiesQueryPayload', () => {
	it('wraps filters under filter.filters', () => {
		const payload = buildSecuritiesQueryPayload({
			take: 50,
			skip: 0,
			filters: [{ field: 'ticker', operator: 'eq', value: 'AAPL.US' }],
		});
		expect(payload.filter).toEqual({
			filters: [{ field: 'ticker', operator: 'eq', value: 'AAPL.US' }],
		});
	});
});

describe('buildFxRatesPayload', () => {
	it('omits date when not provided', () => {
		expect(
			buildFxRatesPayload({ baseCurrency: 'USD', currencies: ['EUR'], timezone: 'UTC' }),
		).toEqual({
			base_currency: 'USD',
			currencies: ['EUR'],
		});
	});

	it('takes the date-only portion when provided', () => {
		const payload = buildFxRatesPayload({
			baseCurrency: 'USD',
			currencies: ['EUR'],
			timezone: 'UTC',
			fxDate: '2026-03-01T12:00:00.000Z',
		});
		expect(payload.date).toBe('2026-03-01');
	});
});
