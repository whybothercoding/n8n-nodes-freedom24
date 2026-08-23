import { INodeProperties } from 'n8n-workflow';

import { buildSimplifyProperty, buildTickerProperty } from './Common.description';

export const quoteOperation: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['quote'] } },
	options: [
		{
			name: 'Get',
			value: 'get',
			description: 'Get real-time quote for a ticker',
			action: 'Get a quote',
		},
		{
			name: 'Get Candlesticks',
			value: 'getCandlesticks',
			description: 'Get historical OHLCV data',
			action: 'Get candlesticks',
		},
		{
			name: 'Get Many',
			value: 'getMany',
			description: 'Get real-time quotes for multiple tickers',
			action: 'Get many quotes',
		},
		{
			name: 'Search',
			value: 'search',
			description: 'Search for tickers',
			action: 'Search tickers',
		},
	],
	default: 'get',
};

export const quoteFields: INodeProperties[] = [
	buildTickerProperty('quote', ['get', 'getCandlesticks']),
	{
		displayName: 'Tickers',
		name: 'tickers',
		type: 'string',
		displayOptions: { show: { resource: ['quote'], operation: ['getMany'] } },
		default: '',
		placeholder: 'AAPL.US, MSFT.US',
		description: 'Comma-separated list of tickers',
	},
	{
		displayName: 'Interval',
		name: 'interval',
		type: 'options',
		displayOptions: { show: { resource: ['quote'], operation: ['getCandlesticks'] } },
		options: [
			{ name: '1 Day', value: '1D' },
			{ name: '1 Hour', value: '1H' },
			{ name: '1 Minute', value: '1M' },
			{ name: '1 Week', value: '1W' },
			{ name: '15 Minutes', value: '15M' },
			{ name: '30 Minutes', value: '30M' },
			{ name: '4 Hours', value: '4H' },
			{ name: '5 Minutes', value: '5M' },
		],
		default: '1D',
	},
	{
		displayName: 'Count',
		name: 'count',
		type: 'number',
		displayOptions: { show: { resource: ['quote'], operation: ['getCandlesticks'] } },
		default: 100,
		description: 'Number of candles to return',
	},
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		displayOptions: { show: { resource: ['quote'], operation: ['search'] } },
		default: '',
		required: true,
		description: 'Free-text search — company name or partial ticker',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		displayOptions: { show: { resource: ['quote'], operation: ['search'] } },
		default: 50,
		description: 'Max number of results to return',
	},
	buildSimplifyProperty('quote', ['get', 'getMany', 'getCandlesticks', 'search']),
];
