import { INodeProperties } from 'n8n-workflow';

import { buildTickerProperty } from './Common.description';

export const securityOperation: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['security'] } },
	options: [
		{
			name: 'Get Info',
			value: 'getInfo',
			description: 'Get instrument details',
			action: 'Get security info',
		},
		{
			name: 'Get Many',
			value: 'getAll',
			description: 'Query the full securities directory',
			action: 'Get many securities',
		},
		{
			name: 'Get Top',
			value: 'getTop',
			description: 'Get most traded / fastest-growing securities',
			action: 'Get top securities',
		},
	],
	default: 'getInfo',
};

export const securityFields: INodeProperties[] = [
	buildTickerProperty('security', ['getInfo']),
	{
		displayName: 'Take',
		name: 'take',
		type: 'number',
		displayOptions: { show: { resource: ['security'], operation: ['getAll'] } },
		default: 50,
		description: 'Page size',
	},
	{
		displayName: 'Skip',
		name: 'skip',
		type: 'number',
		displayOptions: { show: { resource: ['security'], operation: ['getAll'] } },
		default: 0,
		description: 'Offset',
	},
	{
		displayName: 'Filters (JSON)',
		name: 'filtersJson',
		type: 'string',
		displayOptions: { show: { resource: ['security'], operation: ['getAll'] } },
		default: '[]',
		description: 'Filters array as JSON, e.g. [{"field":"ticker","operator":"eq","value":"AAPL.US"}]',
	},
	{
		displayName: 'Sort (JSON)',
		name: 'sortJson',
		type: 'string',
		displayOptions: { show: { resource: ['security'], operation: ['getAll'] } },
		default: '[]',
		description: 'Sort spec array as JSON, e.g. [{"field":"ticker","dir":"asc"}]',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		displayOptions: { show: { resource: ['security'], operation: ['getTop'] } },
		default: 50,
		description: 'Max number of results to return',
	},
];
