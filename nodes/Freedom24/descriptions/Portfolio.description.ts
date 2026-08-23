import { INodeProperties } from 'n8n-workflow';

import { buildSimplifyProperty } from './Common.description';

export const portfolioOperation: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: { show: { resource: ['portfolio'] } },
	options: [
		{
			name: 'Get Many',
			value: 'getAll',
			description: 'Get current portfolio positions and account balances',
			action: 'Get portfolio',
		},
	],
	default: 'getAll',
};

export const portfolioFields: INodeProperties[] = [buildSimplifyProperty('portfolio', ['getAll'])];
