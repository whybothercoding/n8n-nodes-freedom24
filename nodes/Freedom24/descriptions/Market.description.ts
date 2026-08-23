import { INodeProperties } from 'n8n-workflow';

export const marketOperation: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['market'] } },
	options: [
		{
			name: 'Get Status',
			value: 'getStatus',
			description: 'Get market open/close statuses',
			action: 'Get market status',
		},
	],
	default: 'getStatus',
};

export const marketFields: INodeProperties[] = [
	{
		displayName: 'Market Mode',
		name: 'marketMode',
		type: 'string',
		displayOptions: { show: { resource: ['market'], operation: ['getStatus'] } },
		default: '',
		description: 'Optional mode filter (e.g. "demo")',
	},
];
