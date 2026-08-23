import { INodeProperties } from 'n8n-workflow';

export const authenticationProperty: INodeProperties = {
	displayName: 'Authentication',
	name: 'authentication',
	type: 'options',
	options: [
		{ name: 'API Key', value: 'apiKey' },
		{ name: 'User Login', value: 'userLogin' },
	],
	default: 'apiKey',
};

export const resourceProperty: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{ name: 'Alert', value: 'alert' },
		{ name: 'Dynamic', value: 'dynamic' },
		{ name: 'FX', value: 'fx' },
		{ name: 'History', value: 'history' },
		{ name: 'Market', value: 'market' },
		{ name: 'Order', value: 'order' },
		{ name: 'Portfolio', value: 'portfolio' },
		{ name: 'Quote', value: 'quote' },
		{ name: 'Security', value: 'security' },
		{ name: 'Watchlist', value: 'watchlist' },
	],
	default: 'portfolio',
};

/**
 * Ticker as a resourceLocator: a raw-entry mode (default — accepts any string, e.g. `AAPL.US`,
 * with no round trip) plus a searchable list mode backed by methods.listSearch.searchTickers.
 * Each resource gets its own copy scoped to exactly the operations that use it, which is what
 * keeps it from rendering on operations that don't (the old shared field leaked onto
 * quote.getMany and order.getAll).
 */
export function buildTickerProperty(
	resource: string,
	operations: string[],
	overrides: Partial<INodeProperties> = {},
): INodeProperties {
	return {
		displayName: 'Ticker',
		name: 'ticker',
		type: 'resourceLocator',
		default: { mode: 'id', value: '' },
		displayOptions: { show: { resource: [resource], operation: operations } },
		description: 'The ticker symbol, including the market suffix (e.g. AAPL.US)',
		modes: [
			{
				displayName: 'Ticker',
				name: 'id',
				type: 'string',
				placeholder: 'AAPL.US',
				hint: 'Ticker symbol including the market suffix, e.g. AAPL.US',
			},
			{
				displayName: 'Search',
				name: 'list',
				type: 'list',
				placeholder: 'Search for a ticker...',
				typeOptions: {
					searchListMethod: 'searchTickers',
					searchable: true,
				},
			},
		],
		...overrides,
	};
}

/**
 * Builds a resource-scoped Confirm/Dry Run pair. Each resource owns its own copy rather than
 * sharing one global pair behind a show/hide matrix — that matrix used to drift out of sync with
 * the operation list (watchlist.select briefly shipped with no safety gate at all because of it).
 */
/**
 * Only offered on operations where the raw Tradernet envelope has been verified against a real
 * response and the unwrapping is known-correct (see helpers/responses.ts). Defaults on — a fresh
 * user gets clean, per-record items immediately; toggling off returns the original raw envelope
 * unchanged, so nothing here removes the pre-refactor behavior, only adds a better default.
 */
export function buildSimplifyProperty(resource: string, operations: string[]): INodeProperties {
	return {
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		displayOptions: { show: { resource: [resource], operation: operations } },
		default: true,
		description:
			'Whether to unwrap Tradernet\'s response envelope and return one item per record. Turn off to get the raw API response exactly as Tradernet sent it.',
	};
}

export function buildConfirmAndDryRun(resource: string, operations: string[]): INodeProperties[] {
	const displayOptions = { show: { resource: [resource], operation: operations } };
	return [
		{
			displayName: 'Confirm',
			name: 'confirm',
			type: 'boolean',
			displayOptions,
			default: false,
			description: 'Whether to confirm this live, account-mutating action',
		},
		{
			displayName: 'Dry Run',
			name: 'dryRun',
			type: 'boolean',
			displayOptions,
			default: false,
			description: 'Whether to return the prepared request payload without sending it',
		},
	];
}
