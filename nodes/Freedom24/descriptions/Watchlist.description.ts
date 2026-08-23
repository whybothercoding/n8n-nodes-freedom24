import { INodeProperties } from 'n8n-workflow';

import { buildConfirmAndDryRun, buildSimplifyProperty, buildTickerProperty } from './Common.description';

const MUTATING_OPS = ['create', 'update', 'delete', 'select', 'addTicker', 'removeTicker'];

export const watchlistOperation: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['watchlist'] } },
	options: [
		{
			name: 'Add Ticker',
			value: 'addTicker',
			description: 'Add a ticker to a watchlist',
			action: 'Add ticker to watchlist',
		},
		{
			name: 'Create',
			value: 'create',
			description: 'Create a new watchlist',
			action: 'Create a watchlist',
		},
		{
			name: 'Delete',
			value: 'delete',
			description: 'Delete a watchlist',
			action: 'Delete a watchlist',
		},
		{
			name: 'Get Many',
			value: 'getAll',
			description: 'Get many saved watchlists',
			action: 'Get many watchlists',
		},
		{
			name: 'Remove Ticker',
			value: 'removeTicker',
			description: 'Remove a ticker from a watchlist',
			action: 'Remove ticker from watchlist',
		},
		{
			name: 'Select',
			value: 'select',
			description: 'Make a watchlist the active one',
			action: 'Select a watchlist',
		},
		{
			name: 'Update',
			value: 'update',
			description: 'Update a watchlist',
			action: 'Update a watchlist',
		},
	],
	default: 'getAll',
};

export const watchlistFields: INodeProperties[] = [
	{
		displayName: 'List ID',
		name: 'listId',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['watchlist'],
				operation: ['delete', 'addTicker', 'removeTicker', 'update', 'select'],
			},
		},
		default: 0,
		required: true,
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		displayOptions: { show: { resource: ['watchlist'], operation: ['create', 'update'] } },
		default: '',
		description: 'Name of the watchlist. On Update, leave blank to keep the current name.',
	},
	{
		displayName: 'Tickers',
		name: 'tickers',
		type: 'string',
		displayOptions: { show: { resource: ['watchlist'], operation: ['create'] } },
		default: '',
		placeholder: 'AAPL.US, MSFT.US',
		description: 'Comma-separated list of tickers to seed the new watchlist with',
	},
	{
		displayName: 'Picture',
		name: 'picture',
		type: 'string',
		displayOptions: { show: { resource: ['watchlist'], operation: ['create', 'update'] } },
		default: '',
		description: 'Icon/emoji for the watchlist. On Update, leave blank to keep the current one.',
	},
	buildTickerProperty('watchlist', ['addTicker', 'removeTicker']),
	{
		displayName: 'Index',
		name: 'index',
		type: 'number',
		displayOptions: { show: { resource: ['watchlist'], operation: ['update', 'addTicker'] } },
		default: 0,
		description: 'Position in the list — always sent, so this repositions the entry on every call',
	},
	buildSimplifyProperty('watchlist', ['getAll']),
	...buildConfirmAndDryRun('watchlist', MUTATING_OPS),
];
