 
import { describe, expect, it } from 'vitest';

import {
	extractRecordArray,
	getApiError,
	isCommandNotFound,
	unwrapCandlesticks,
	unwrapPortfolio,
	RECORD_ARRAY_PATHS,
} from '../../nodes/Freedom24/helpers/responses';

describe('getApiError', () => {
	it('reads a top-level error field', () => {
		expect(getApiError({ error: 'Invalid ticker' })).toBe('Invalid ticker');
	});

	it('reads a top-level errMsg field', () => {
		expect(getApiError({ errMsg: 'Insufficient funds' })).toBe('Insufficient funds');
	});

	it('returns undefined for a clean response', () => {
		expect(getApiError({ result: 'ok' })).toBeUndefined();
	});

	it('ignores an empty-string error', () => {
		expect(getApiError({ error: '' })).toBeUndefined();
	});

	it('is safe against non-object input', () => {
		expect(getApiError(null)).toBeUndefined();
		expect(getApiError(undefined)).toBeUndefined();
		expect(getApiError('a string')).toBeUndefined();
	});
});

describe('isCommandNotFound', () => {
	it('matches the literal Tradernet message', () => {
		expect(isCommandNotFound({ error: 'Command not found' })).toBe(true);
	});

	it('does not match other errors', () => {
		expect(isCommandNotFound({ error: 'Invalid ticker' })).toBe(false);
	});
});

describe('extractRecordArray', () => {
	it('returns the first matching path', () => {
		const response = { result: { q: [{ c: 'AAPL.US' }] } };
		expect(extractRecordArray(response, RECORD_ARRAY_PATHS.quotes)).toEqual([{ c: 'AAPL.US' }]);
	});

	it('falls back through candidate paths in order', () => {
		const response = { orders: [{ id: 1 }] };
		expect(extractRecordArray(response, RECORD_ARRAY_PATHS.orders)).toEqual([{ id: 1 }]);
	});

	it('reaches a deeply nested array path', () => {
		const response = { result: { orders: { order: [{ id: 1 }] } } };
		expect(extractRecordArray(response, RECORD_ARRAY_PATHS.orders)).toEqual([{ id: 1 }]);
	});

	it('returns null (not []) when nothing matches, so callers can fall back safely', () => {
		expect(extractRecordArray({ unexpected: true }, RECORD_ARRAY_PATHS.watchlists)).toBeNull();
	});
});

describe('unwrapPortfolio', () => {
	it('extracts OPQ.ps', () => {
		const response = { OPQ: { ps: { loaded: true, pos: [] } } };
		expect(unwrapPortfolio(response)).toEqual({ loaded: true, pos: [] });
	});

	it('falls back to an empty portfolio shape when OPQ.ps is missing', () => {
		expect(unwrapPortfolio({})).toEqual({ loaded: false, acc: [], pos: [] });
	});
});

describe('unwrapCandlesticks', () => {
	it('extracts candles keyed directly by ticker at the response root', () => {
		const response = { 'AAPL.US': [{ t: 1, c: 100 }] };
		expect(unwrapCandlesticks(response, 'AAPL.US')).toEqual([{ t: 1, c: 100 }]);
	});

	it('extracts a flat hloc array', () => {
		const response = { hloc: [{ t: 1, c: 100 }] };
		expect(unwrapCandlesticks(response, 'AAPL.US')).toEqual([{ t: 1, c: 100 }]);
	});

	it('extracts hloc keyed by ticker under result', () => {
		const response = { result: { hloc: { 'AAPL.US': [{ t: 1, c: 100 }] } } };
		expect(unwrapCandlesticks(response, 'AAPL.US')).toEqual([{ t: 1, c: 100 }]);
	});

	it('returns an empty array when no shape matches', () => {
		expect(unwrapCandlesticks({ unexpected: true }, 'AAPL.US')).toEqual([]);
	});
});
