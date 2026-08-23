import { INodeProperties } from 'n8n-workflow';

export const fxOperation: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['fx'] } },
	options: [
		{
			name: 'Get Rates',
			value: 'getRates',
			description: 'Get FX cross rates',
			action: 'Get cross rates',
		},
	],
	default: 'getRates',
};

export const fxFields: INodeProperties[] = [
	{
		displayName: 'Base Currency',
		name: 'baseCurrency',
		type: 'string',
		displayOptions: { show: { resource: ['fx'], operation: ['getRates'] } },
		default: 'USD',
		required: true,
	},
	{
		displayName: 'Currencies',
		name: 'currencies',
		type: 'string',
		displayOptions: { show: { resource: ['fx'], operation: ['getRates'] } },
		default: 'EUR',
		required: true,
		description: 'Comma-separated list of currencies',
	},
	{
		displayName: 'Date',
		name: 'fxDate',
		type: 'dateTime',
		displayOptions: { show: { resource: ['fx'], operation: ['getRates'] } },
		default: '',
		description: 'Date for historical rates (optional, defaults to today)',
	},
];
