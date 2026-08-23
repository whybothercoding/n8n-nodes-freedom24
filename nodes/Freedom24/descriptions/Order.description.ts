import { INodeProperties } from 'n8n-workflow';

import { buildConfirmAndDryRun, buildSimplifyProperty, buildTickerProperty } from './Common.description';

const MUTATING_OPS = ['place', 'cancel', 'bulkCancel', 'updateProtection'];

export const orderOperation: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['order'] } },
	options: [
		{
			name: 'Bulk Cancel',
			value: 'bulkCancel',
			description: 'Cancel multiple orders by ID',
			action: 'Bulk cancel orders',
		},
		{
			name: 'Cancel',
			value: 'cancel',
			description: 'Cancel an existing order',
			action: 'Cancel an order',
		},
		{
			name: 'Get Many',
			value: 'getAll',
			description: 'Get list of current/active orders',
			action: 'Get many orders',
		},
		{
			name: 'Place',
			value: 'place',
			description: 'Place a new order',
			action: 'Place an order',
		},
		{
			name: 'Update Protection',
			value: 'updateProtection',
			description: 'Update take-profit/stop-loss for an open position',
			action: 'Update protection',
		},
	],
	default: 'getAll',
};

export const orderFields: INodeProperties[] = [
	buildTickerProperty('order', ['place', 'updateProtection']),
	{
		displayName: 'Side',
		name: 'side',
		type: 'options',
		displayOptions: { show: { resource: ['order'], operation: ['place'] } },
		options: [
			{ name: 'Buy', value: 'buy' },
			{ name: 'Sell', value: 'sell' },
		],
		default: 'buy',
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		displayOptions: { show: { resource: ['order'], operation: ['place'] } },
		options: [
			{ name: 'Limit', value: 'limit' },
			{ name: 'Market', value: 'market' },
		],
		default: 'market',
	},
	{
		displayName: 'Quantity',
		name: 'quantity',
		type: 'number',
		displayOptions: { show: { resource: ['order'], operation: ['place'] } },
		default: 1,
		required: true,
	},
	{
		displayName: 'Price',
		name: 'price',
		type: 'number',
		displayOptions: {
			show: { resource: ['order'], operation: ['place'], type: ['limit'] },
		},
		default: 0,
		description: 'Required for limit orders — must be greater than 0',
	},
	{
		displayName: 'Take Profit',
		name: 'takeProfit',
		type: 'number',
		displayOptions: { show: { resource: ['order'], operation: ['place', 'updateProtection'] } },
		default: 0,
		description: 'Take-profit trigger price. 0 = not set.',
	},
	{
		displayName: 'Stop Loss',
		name: 'stopLoss',
		type: 'number',
		displayOptions: { show: { resource: ['order'], operation: ['place', 'updateProtection'] } },
		default: 0,
		description: 'Stop-loss trigger price. 0 = not set.',
	},
	{
		displayName: 'Stop Loss Percent',
		name: 'stopLossPercent',
		type: 'number',
		displayOptions: { show: { resource: ['order'], operation: ['place', 'updateProtection'] } },
		default: 0,
		description: 'Stop-loss trigger as a percent below entry. 0 = not set.',
	},
	{
		displayName: 'Trailing Percent',
		name: 'trailingPercent',
		type: 'number',
		displayOptions: { show: { resource: ['order'], operation: ['place', 'updateProtection'] } },
		default: 0,
		description: 'Trailing stop-loss percent. 0 = not set.',
	},
	{
		displayName: 'Expiration ID',
		name: 'expirationId',
		type: 'number',
		displayOptions: { show: { resource: ['order'], operation: ['place', 'updateProtection'] } },
		default: 3,
		description: '3 = GTC (Good Till Cancelled)',
	},
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		displayOptions: { show: { resource: ['order'], operation: ['cancel'] } },
		default: '',
		required: true,
	},
	{
		displayName: 'Order IDs',
		name: 'orderIds',
		type: 'string',
		displayOptions: { show: { resource: ['order'], operation: ['bulkCancel'] } },
		default: '',
		required: true,
		description: 'Comma-separated list of order IDs',
	},
	buildSimplifyProperty('order', ['getAll']),
	...buildConfirmAndDryRun('order', MUTATING_OPS),
];
