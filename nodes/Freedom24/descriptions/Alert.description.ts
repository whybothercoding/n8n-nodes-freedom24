import { INodeProperties } from 'n8n-workflow';

import { buildConfirmAndDryRun, buildTickerProperty } from './Common.description';

export const alertOperation: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['alert'] } },
	options: [
		{
			name: 'Get Many',
			value: 'getAll',
			description: 'List price alerts',
			action: 'Get alerts',
		},
		{
			name: 'Toggle',
			value: 'toggle',
			description: 'Create or delete a price alert',
			action: 'Toggle alert',
		},
	],
	default: 'getAll',
};

export const alertFields: INodeProperties[] = [
	{
		displayName: 'Triggered Only',
		name: 'triggered',
		type: 'boolean',
		displayOptions: { show: { resource: ['alert'], operation: ['getAll'] } },
		default: false,
		description: 'Whether to return triggered alerts only',
	},
	buildTickerProperty('alert', ['getAll'], { description: 'Optional ticker filter (e.g. AAPL.US)' }),
	{
		displayName: 'Delete Alert',
		name: 'deleteAlert',
		type: 'boolean',
		displayOptions: { show: { resource: ['alert'], operation: ['toggle'] } },
		default: false,
		description: 'Whether to delete the alert (requires Alert ID) instead of creating one',
	},
	buildTickerProperty('alert', ['toggle'], { description: 'Required to create an alert' }),
	{
		displayName: 'Price',
		name: 'price',
		type: 'number',
		displayOptions: { show: { resource: ['alert'], operation: ['toggle'] } },
		default: 0,
		description: 'Trigger price — required to create an alert',
	},
	{
		displayName: 'Trigger Type',
		name: 'triggerType',
		type: 'string',
		displayOptions: { show: { resource: ['alert'], operation: ['toggle'] } },
		default: 'last_more',
		description: 'E.g. last_more, last_less.',
	},
	{
		displayName: 'Quote Type',
		name: 'quoteType',
		type: 'string',
		displayOptions: { show: { resource: ['alert'], operation: ['toggle'] } },
		default: 'ltp',
	},
	{
		displayName: 'Notification Type',
		name: 'notificationType',
		type: 'string',
		displayOptions: { show: { resource: ['alert'], operation: ['toggle'] } },
		default: 'email',
	},
	{
		displayName: 'Alert Period',
		name: 'alertPeriod',
		type: 'number',
		displayOptions: { show: { resource: ['alert'], operation: ['toggle'] } },
		default: 0,
	},
	{
		displayName: 'Expire',
		name: 'expire',
		type: 'number',
		displayOptions: { show: { resource: ['alert'], operation: ['toggle'] } },
		default: 0,
	},
	{
		displayName: 'Alert ID',
		name: 'alertId',
		type: 'number',
		displayOptions: { show: { resource: ['alert'], operation: ['toggle'] } },
		default: 0,
		description: 'Required to delete an alert',
	},
	...buildConfirmAndDryRun('alert', ['toggle']),
];
