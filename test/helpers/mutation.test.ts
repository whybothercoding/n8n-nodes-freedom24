 
import { describe, expect, it } from 'vitest';

import { looksLikeMutatingCommand } from '../../nodes/Freedom24/helpers/mutation';

describe('looksLikeMutatingCommand', () => {
	it('flags known Tradernet mutating commands', () => {
		for (const command of [
			'putOrderV2',
			'deleteOrder',
			'addStockList',
			'updateStockList',
			'togglePriceAlert',
			'makeStockListSelected',
		]) {
			expect(looksLikeMutatingCommand(command)).toBe(true);
		}
	});

	it('flags the broadened prefixes the original substring heuristic missed', () => {
		for (const command of ['cancelOrder', 'removeStockListTicker', 'createSomething', 'setFlag', 'saveDraft', 'editProfile']) {
			expect(looksLikeMutatingCommand(command)).toBe(true);
		}
	});

	it('flags trading/account verbs not covered by the built-in fixed commands', () => {
		for (const command of [
			'buyStock',
			'sellStock',
			'closePosition',
			'confirmOrder',
			'rejectOrder',
			'withdrawFunds',
			'transferCash',
			'convertCurrency',
			'exerciseOption',
		]) {
			expect(looksLikeMutatingCommand(command)).toBe(true);
		}
	});

	it('does not flag read-only commands', () => {
		for (const command of ['getOPQ', 'getStockQuotesJson', 'getMarketStatus', 'tickerFinder']) {
			expect(looksLikeMutatingCommand(command)).toBe(false);
		}
	});

	it('is case-insensitive', () => {
		expect(looksLikeMutatingCommand('PUTORDERV2')).toBe(true);
	});
});
