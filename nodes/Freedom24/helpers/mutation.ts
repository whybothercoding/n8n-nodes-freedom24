/**
 * Safety-conservative guess at whether an arbitrary `dynamic.call` command mutates account state.
 * Tradernet's own command names are consistently verb-prefixed (putTradeOrder, delTradeOrder,
 * addStockList, updateStockList, togglePriceAlert, makeStockListSelected, ...), so this checks
 * for a *prefix* match rather than a substring — a substring check would also flag safe reads
 * whose names happen to contain one of these words. The list itself errs toward more false
 * positives (blocking a command that turns out to be safe) over any false negative (letting a
 * real mutation through unconfirmed) — this only gates a confirmation prompt, so the cost of
 * over-blocking is a wasted click, not a wrong trade.
 */
const MUTATING_PREFIXES = [
	'put',
	'delete',
	'del',
	'add',
	'update',
	'toggle',
	'make',
	'cancel',
	'remove',
	'create',
	'set',
	'save',
	'edit',
	'buy',
	'sell',
	'close',
	'confirm',
	'reject',
	'withdraw',
	'transfer',
	'convert',
	'exercise',
];

export function looksLikeMutatingCommand(command: string): boolean {
	const normalized = command.toLowerCase();
	return MUTATING_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}
