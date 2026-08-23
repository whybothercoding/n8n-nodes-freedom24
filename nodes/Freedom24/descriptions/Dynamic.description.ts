import { INodeProperties } from 'n8n-workflow';

import { buildConfirmAndDryRun } from './Common.description';

export const dynamicOperation: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['dynamic'] } },
	options: [
		{
			name: 'Call',
			value: 'call',
			description: 'Call any Tradernet API command',
			action: 'Dynamic call',
		},
	],
	default: 'call',
};

export const dynamicFields: INodeProperties[] = [
	{
		displayName: 'Command',
		name: 'command',
		type: 'string',
		displayOptions: { show: { resource: ['dynamic'], operation: ['call'] } },
		default: '',
		required: true,
		description: 'Tradernet API command name, e.g. putTradeOrder, getOPQ',
	},
	{
		displayName: 'Parameters (JSON)',
		name: 'parametersJson',
		type: 'string',
		displayOptions: { show: { resource: ['dynamic'], operation: ['call'] } },
		default: '{}',
	},
	...buildConfirmAndDryRun('dynamic', ['call']),
];
