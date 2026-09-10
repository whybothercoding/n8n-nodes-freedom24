 
import { describe, expect, it } from 'vitest';

import { resolveTickerParam } from '../../nodes/Freedom24/helpers/ticker';

describe('resolveTickerParam', () => {
	it('passes through a plain string (legacy / hand-built workflow JSON)', () => {
		expect(resolveTickerParam('AAPL.US')).toBe('AAPL.US');
	});

	it('extracts value from a resourceLocator object', () => {
		expect(resolveTickerParam({ mode: 'id', value: 'AAPL.US' })).toBe('AAPL.US');
	});

	it('extracts value from list mode too', () => {
		expect(resolveTickerParam({ mode: 'list', value: 'AAPL.US', cachedResultName: 'Apple' })).toBe(
			'AAPL.US',
		);
	});

	it('returns an empty string for null/undefined', () => {
		expect(resolveTickerParam(undefined)).toBe('');
		expect(resolveTickerParam(null)).toBe('');
	});
});
