import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	NodeOperationError,
	IDataObject,
	JsonObject,
} from 'n8n-workflow';

import * as crypto from 'crypto';

export class Freedom24 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Freedom24',
		name: 'freedom24',
		icon: 'file:freedom24.svg',
		group: ['transform'],
		version: 1,
		description: 'Interact with Freedom24 / Tradernet API',
		defaults: {
			name: 'Freedom24',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'freedom24Api',
				required: true,
				displayOptions: {
					show: {
						authentication: ['apiKey'],
					},
				},
			},
			{
				name: 'freedom24UserApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['userLogin'],
					},
				},
			},
		],
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{
						name: 'API Key',
						value: 'apiKey',
					},
					{
						name: 'User Login',
						value: 'userLogin',
					},
				],
				default: 'apiKey',
			},
			{
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
					{ name: 'News', value: 'news' },
					{ name: 'Order', value: 'order' },
					{ name: 'Portfolio', value: 'portfolio' },
					{ name: 'Quote', value: 'quote' },
					{ name: 'Security', value: 'security' },
					{ name: 'Watchlist', value: 'watchlist' },
				],
				default: 'portfolio',
			},
			// Portfolio Operations
			{
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
			},
			// Quote Operations
			{
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
						name: 'Get Many',
						value: 'getMany',
						description: 'Get real-time quotes for multiple tickers',
						action: 'Get many quotes',
					},
					{
						name: 'Get History',
						value: 'getHistory',
						description: 'Get historical OHLCV data',
						action: 'Get candlesticks',
					},
					{
						name: 'Search',
						value: 'search',
						description: 'Search for tickers',
						action: 'Search tickers',
					},
				],
				default: 'get',
			},
			// Order Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['order'] } },
				options: [
					{
						name: 'Bulk Cancel',
						value: 'bulkCancel',
						description: 'Cancel multiple orders',
						action: 'Bulk cancel',
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
						description: 'Update TP/SL for a ticker',
						action: 'Update protection',
					},
				],
				default: 'getAll',
			},
			// Market Operations
			{
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
			},
			// News Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['news'] } },
				options: [
					{
						name: 'Get Many',
						value: 'getMany',
						description: 'Get market news for a ticker or search term',
						action: 'Get news',
					},
				],
				default: 'getMany',
			},
			// Watchlist Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['watchlist'] } },
				options: [
					{
						name: 'Add Ticker',
						value: 'addTicker',
						description: 'Add ticker to watchlist',
						action: 'Add ticker',
					},
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new watchlist',
						action: 'Create watchlist',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a watchlist',
						action: 'Delete watchlist',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many saved watchlists',
						action: 'Get watchlists',
					},
					{
						name: 'Remove Ticker',
						value: 'removeTicker',
						description: 'Remove ticker from watchlist',
						action: 'Remove ticker',
					},
					{
						name: 'Select',
						value: 'select',
						description: 'Select a watchlist',
						action: 'Select watchlist',
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update a watchlist',
						action: 'Update watchlist',
					},
				],
				default: 'getAll',
			},
			// Security Operations
			{
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
			},
			// History Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['history'] } },
				options: [
					{
						name: 'Get Orders',
						value: 'getOrders',
						description: 'Get orders history',
						action: 'Get orders history',
					},
					{
						name: 'Get Trades',
						value: 'getTrades',
						description: 'Get trades history',
						action: 'Get trades history',
					},
					{
						name: 'Get Cashflows',
						value: 'getCashflows',
						description: 'Get cash movement history',
						action: 'Get cashflows',
					},
				],
				default: 'getOrders',
			},
			// Alert Operations
			{
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
			},
			// FX Operations
			{
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
			},
			// Dynamic Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['dynamic'] } },
				options: [
					{
						name: 'Call',
						value: 'call',
						description: 'Call any API command',
						action: 'Dynamic call',
					},
				],
				default: 'call',
			},

			// SHARED PARAMETERS
			{
				displayName: 'Ticker',
				name: 'ticker',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['quote', 'order', 'watchlist', 'security', 'alert', 'news'],
						operation: [
							'get',
							'getHistory',
							'place',
							'updateProtection',
							'addTicker',
							'removeTicker',
							'getInfo',
							'toggle',
							'getMany',
							'getAll',
						],
					},
					hide: {
						resource: ['security', 'watchlist', 'alert'],
						operation: ['getAll'],
					},
				},
				default: '',
				placeholder: 'AAPL.US',
				description: 'Ticker symbol (e.g., AAPL.US)',
			},
			{
				displayName: 'Tickers',
				name: 'tickers',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['quote', 'watchlist'],
						operation: ['getMany', 'create'],
					},
				},
				default: '',
				description: 'Comma-separated list of tickers',
			},
			{
				displayName: 'Interval',
				name: 'interval',
				type: 'options',
				displayOptions: { show: { resource: ['quote'], operation: ['getHistory'] } },
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
				displayOptions: { show: { resource: ['quote'], operation: ['getHistory'] } },
				default: 100,
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				description: 'Max number of results to return',
				displayOptions: {
					show: {
						resource: ['quote', 'news', 'security'],
						operation: ['search', 'getMany', 'getTop'],
					},
				},
				default: 50,
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				displayOptions: { show: { resource: ['quote'], operation: ['search'] } },
				default: '',
				required: true,
			},
			{
				displayName: 'Search For',
				name: 'searchFor',
				type: 'string',
				displayOptions: { show: { resource: ['news'], operation: ['getMany'] } },
				default: '',
				description: 'Search term or company name',
			},
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
					{ name: 'Market', value: 'market' },
					{ name: 'Limit', value: 'limit' },
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
					show: {
						resource: ['order', 'alert'],
						operation: ['place', 'toggle'],
					},
					hide: {
						resource: ['order'],
						type: ['market'],
					},
				},
				default: 0,
			},
			{
				displayName: 'Take Profit',
				name: 'takeProfit',
				type: 'number',
				displayOptions: { show: { resource: ['order'], operation: ['place', 'updateProtection'] } },
				default: 0,
			},
			{
				displayName: 'Stop Loss',
				name: 'stopLoss',
				type: 'number',
				displayOptions: { show: { resource: ['order'], operation: ['place', 'updateProtection'] } },
				default: 0,
			},
			{
				displayName: 'Stop Loss Percent',
				name: 'stopLossPercent',
				type: 'number',
				displayOptions: { show: { resource: ['order'], operation: ['place', 'updateProtection'] } },
				default: 0,
			},
			{
				displayName: 'Trailing Percent',
				name: 'trailingPercent',
				type: 'number',
				displayOptions: { show: { resource: ['order'], operation: ['place', 'updateProtection'] } },
				default: 0,
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
				description: 'Name of the watchlist',
			},
			{
				displayName: 'Picture',
				name: 'picture',
				type: 'string',
				displayOptions: { show: { resource: ['watchlist'], operation: ['create', 'update'] } },
				default: '',
				description: 'Icon or emoji for the watchlist',
			},
			{
				displayName: 'Index',
				name: 'index',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['watchlist'],
						operation: ['update', 'addTicker'],
					},
				},
				default: 0,
				description: 'Position in the list',
			},
			{
				displayName: 'From',
				name: 'from',
				type: 'dateTime',
				displayOptions: { show: { resource: ['history'], operation: ['getOrders', 'getTrades'] } },
				default: '',
				required: true,
			},
			{
				displayName: 'Till',
				name: 'till',
				type: 'dateTime',
				displayOptions: { show: { resource: ['history'], operation: ['getOrders', 'getTrades'] } },
				default: '',
				required: true,
			},
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'number',
				displayOptions: { show: { resource: ['history'], operation: ['getCashflows'] } },
				default: 0,
			},
			{
				displayName: 'Group By Type',
				name: 'groupByType',
				type: 'boolean',
				displayOptions: { show: { resource: ['history'], operation: ['getCashflows'] } },
				default: false,
				description: 'Whether to group results by type',
			},
			{
				displayName: 'Cash Totals',
				name: 'cashTotals',
				type: 'boolean',
				displayOptions: { show: { resource: ['history'], operation: ['getCashflows'] } },
				default: false,
				description: 'Whether to include cash totals',
			},
			{
				displayName: 'Hide Limits',
				name: 'hideLimits',
				type: 'boolean',
				displayOptions: { show: { resource: ['history'], operation: ['getCashflows'] } },
				default: false,
				description: 'Whether to hide limits block',
			},
			{
				displayName: 'Take',
				name: 'take',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['security', 'history'],
						operation: ['getAll', 'getCashflows'],
					},
				},
				default: 50,
			},
			{
				displayName: 'Skip',
				name: 'skip',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['security', 'history'],
						operation: ['getAll', 'getCashflows'],
					},
				},
				default: 0,
			},
			{
				displayName: 'Without Refund',
				name: 'withoutRefund',
				type: 'boolean',
				displayOptions: { show: { resource: ['history'], operation: ['getCashflows'] } },
				default: false,
				description: 'Whether to exclude refunds',
			},
			{
				displayName: 'Filters (JSON)',
				name: 'filtersJson',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['security', 'history'],
						operation: ['getAll', 'getCashflows'],
					},
				},
				default: '[]',
				description: 'Filters array as JSON',
			},
			{
				displayName: 'Sort (JSON)',
				name: 'sortJson',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['security', 'history'],
						operation: ['getAll', 'getCashflows'],
					},
				},
				default: '[]',
				description: 'Sort spec array as JSON',
			},
			{
				displayName: 'Triggered Only',
				name: 'triggered',
				type: 'boolean',
				displayOptions: { show: { resource: ['alert'], operation: ['getAll'] } },
				default: false,
				description: 'Whether to return triggered alerts only',
			},
			{
				displayName: 'Trigger Type',
				name: 'triggerType',
				type: 'string',
				displayOptions: { show: { resource: ['alert'], operation: ['toggle'] } },
				default: 'last_more',
				description: 'Last_more, last_less, etc',
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
				description: 'Required for delete',
			},
			{
				displayName: 'Delete Alert',
				name: 'deleteAlert',
				type: 'boolean',
				displayOptions: { show: { resource: ['alert'], operation: ['toggle'] } },
				default: false,
				description: 'Whether to delete the alert',
			},
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
				displayName: 'Command',
				name: 'command',
				type: 'string',
				displayOptions: { show: { resource: ['dynamic'], operation: ['call'] } },
				default: '',
				required: true,
			},
			{
				displayName: 'Parameters (JSON)',
				name: 'parametersJson',
				type: 'string',
				displayOptions: { show: { resource: ['dynamic'], operation: ['call'] } },
				default: '{}',
			},
			{
				displayName: 'Confirm',
				name: 'confirm',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['order', 'watchlist', 'alert', 'dynamic'],
					},
					hide: {
						resource: ['order', 'watchlist', 'alert'],
						operation: ['getAll', 'select'],
					},
				},
				default: false,
				description: 'Whether to confirm live action',
			},
			{
				displayName: 'Dry Run',
				name: 'dryRun',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['order', 'watchlist', 'alert', 'dynamic'],
					},
					hide: {
						resource: ['order', 'watchlist', 'alert'],
						operation: ['getAll', 'select'],
					},
				},
				default: false,
				description: 'Whether to return payload without sending',
			},
		],
		usableAsTool: true,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const authentication = this.getNodeParameter('authentication', 0) as string;

		const authData: IDataObject = {};

		if (authentication === 'apiKey') {
			const credentials = await this.getCredentials('freedom24Api');
			authData.publicKey = credentials.publicKey;
			authData.privateKey = credentials.privateKey;
		} else if (authentication === 'userLogin') {
			const credentials = await this.getCredentials('freedom24UserApi');
			authData.sid = await getSessionId.call(
				this,
				credentials.login as string,
				credentials.password as string,
			);
		}

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData;
				const confirm = this.getNodeParameter('confirm', i, false) as boolean;
				const dryRun = this.getNodeParameter('dryRun', i, false) as boolean;

				if (resource === 'portfolio') {
					if (operation === 'getAll') {
						responseData = await makeRequest.call(this, 'getOPQ', {}, authentication, authData);
					}
				} else if (resource === 'quote') {
					if (operation === 'get') {
						const ticker = this.getNodeParameter('ticker', i) as string;
						responseData = await makeRequest.call(
							this,
							'getStockQuotesJson',
							{ tickers: [ticker] },
							authentication,
							authData,
						);
					} else if (operation === 'getMany') {
						const tickers = (this.getNodeParameter('tickers', i) as string)
							.split(',')
							.map((t) => t.trim());
						responseData = await makeRequest.call(
							this,
							'getStockQuotesJson',
							{ tickers },
							authentication,
							authData,
						);
					} else if (operation === 'getHistory') {
						const ticker = this.getNodeParameter('ticker', i) as string;
						const interval = this.getNodeParameter('interval', i) as string;
						const count = this.getNodeParameter('count', i) as number;
						const timeframeMap: Record<string, number> = {
							'1M': 1,
							'5M': 5,
							'15M': 15,
							'30M': 30,
							'1H': 60,
							'4H': 240,
							'1D': 1440,
							'1W': 10080,
						};
						responseData = await makeRequest.call(
							this,
							'getHloc',
							{ id: ticker, timeframe: timeframeMap[interval] || 1440, count },
							authentication,
							authData,
						);
					} else if (operation === 'search') {
						const query = this.getNodeParameter('query', i) as string;
						responseData = await makeRequest.call(
							this,
							'tickerFinder',
							{ text: query },
							authentication,
							authData,
						);
					}
				} else if (resource === 'order') {
					if (operation === 'getAll') {
						responseData = await makeRequest.call(
							this,
							'getNotifyOrderJson',
							{},
							authentication,
							authData,
						);
					} else if (operation === 'place') {
						const ticker = this.getNodeParameter('ticker', i) as string;
						const side = this.getNodeParameter('side', i) as string;
						const type = this.getNodeParameter('type', i) as string;
						const quantity = this.getNodeParameter('quantity', i) as number;
						const orderParams: IDataObject = {
							instr_name: ticker,
							action_id: side === 'buy' ? 1 : 3,
							order_type_id: type === 'market' ? 1 : 2,
							qty: quantity,
						};
						if (type === 'limit')
							orderParams.limit_price = this.getNodeParameter('price', i) as number;
						const tp = this.getNodeParameter('takeProfit', i) as number;
						const sl = this.getNodeParameter('stopLoss', i) as number;
						const slp = this.getNodeParameter('stopLossPercent', i) as number;
						const tp_trailing = this.getNodeParameter('trailingPercent', i) as number;
						const expirationId = this.getNodeParameter('expirationId', i) as number;

						if (tp > 0) orderParams.take_profit = tp;
						if (sl > 0) orderParams.stop_loss = sl;
						if (slp > 0) orderParams.stop_loss_percent = slp;
						if (tp_trailing > 0) orderParams.trailing_stop_percent = tp_trailing;
						orderParams.expiration_id = expirationId;

						if (dryRun) {
							responseData = { dryRun: true, command: 'putOrderV2', params: orderParams };
						} else if (!confirm) {
							throw new NodeOperationError(
								this.getNode(),
								'Refusing to place a live order without confirm=true (use dryRun=true to preview).',
								{ itemIndex: i },
							);
						} else {
							responseData = await makeRequest.call(
								this,
								'putOrderV2',
								orderParams,
								authentication,
								authData,
								true,
							);
						}
					} else if (operation === 'cancel') {
						const orderId = this.getNodeParameter('orderId', i) as string;
						const params = { order_id: orderId };
						if (dryRun) {
							responseData = { dryRun: true, command: 'deleteOrder', params };
						} else if (!confirm) {
							throw new NodeOperationError(
								this.getNode(),
								'Refusing to cancel order without confirm=true',
								{ itemIndex: i },
							);
						} else {
							responseData = await makeRequest.call(
								this,
								'deleteOrder',
								params,
								authentication,
								authData,
							);
						}
					} else if (operation === 'updateProtection') {
						const ticker = this.getNodeParameter('ticker', i) as string;
						const tp = this.getNodeParameter('takeProfit', i) as number;
						const sl = this.getNodeParameter('stopLoss', i) as number;
						const slp = this.getNodeParameter('stopLossPercent', i) as number;
						const tp_trailing = this.getNodeParameter('trailingPercent', i) as number;
						const expirationId = this.getNodeParameter('expirationId', i) as number;

						const payload: IDataObject = { instr_name: ticker, expiration_id: expirationId };
						if (tp > 0) payload.take_profit = tp;
						if (sl > 0) payload.stop_loss = sl;
						if (slp > 0) payload.stop_loss_percent = slp;
						if (tp_trailing > 0) payload.trailing_stop_percent = tp_trailing;

						if (dryRun) {
							responseData = { dryRun: true, command: 'putStopLoss', params: payload };
						} else if (!confirm) {
							throw new NodeOperationError(
								this.getNode(),
								'Refusing to update protection without confirm=true',
								{ itemIndex: i },
							);
						} else {
							responseData = await makeRequest.call(
								this,
								'putStopLoss',
								payload,
								authentication,
								authData,
								true,
							);
						}
					} else if (operation === 'bulkCancel') {
						const ids = (this.getNodeParameter('orderIds', i) as string)
							.split(',')
							.map((id) => id.trim());

						if (dryRun) {
							responseData = ids.map((id) => ({
								dryRun: true,
								command: 'deleteOrder',
								params: { order_id: id },
							}));
						} else if (!confirm) {
							throw new NodeOperationError(
								this.getNode(),
								'Refusing to bulk cancel without confirm=true',
								{ itemIndex: i },
							);
						} else {
							responseData = await Promise.all(
								ids.map((id) =>
									makeRequest.call(this, 'deleteOrder', { order_id: id }, authentication, authData),
								),
							);
						}
					}
				} else if (resource === 'market') {
					if (operation === 'getStatus')
						responseData = await makeRequest.call(
							this,
							'getMarketStatus',
							{ market: '*' },
							authentication,
							authData,
						);
				} else if (resource === 'news') {
					if (operation === 'getMany') {
						const ticker = this.getNodeParameter('ticker', i, '') as string;
						const searchFor = this.getNodeParameter('searchFor', i, '') as string;
						const limit = this.getNodeParameter('limit', i, 10) as number;
						const params: IDataObject = { limit };
						if (ticker) params.ticker = ticker;
						if (searchFor) params.searchFor = searchFor;

						responseData = await makeRequest.call(
							this,
							'getNews',
							params,
							authentication,
							authData,
						);
					}
				} else if (resource === 'watchlist') {
					if (operation === 'getAll')
						responseData = await makeRequest.call(
							this,
							'getUserStockLists',
							{},
							authentication,
							authData,
						);
					else if (operation === 'create') {
						const tickersStr = this.getNodeParameter('tickers', i, '') as string;
						const payload: IDataObject = {
							name: this.getNodeParameter('name', i) as string,
							tickers: tickersStr ? tickersStr.split(',').map((t) => t.trim()) : [],
						};
						const picture = this.getNodeParameter('picture', i) as string;
						if (picture) payload.picture = picture;

						if (dryRun) {
							responseData = { dryRun: true, command: 'addStockList', params: payload };
						} else if (!confirm) {
							throw new NodeOperationError(
								this.getNode(),
								'Refusing to create watchlist without confirm=true',
								{ itemIndex: i },
							);
						} else {
							responseData = await makeRequest.call(
								this,
								'addStockList',
								payload,
								authentication,
								authData,
							);
						}
					} else if (operation === 'update') {
						const payload: IDataObject = { id: this.getNodeParameter('listId', i) as number };
						const name = this.getNodeParameter('name', i) as string;
						const picture = this.getNodeParameter('picture', i) as string;
						const index = this.getNodeParameter('index', i) as number;
						if (name) payload.name = name;
						if (picture) payload.picture = picture;
						if (index !== undefined) payload.index = index;

						if (dryRun) {
							responseData = { dryRun: true, command: 'updateStockList', params: payload };
						} else if (!confirm) {
							throw new NodeOperationError(
								this.getNode(),
								'Refusing to update watchlist without confirm=true',
								{ itemIndex: i },
							);
						} else {
							responseData = await makeRequest.call(
								this,
								'updateStockList',
								payload,
								authentication,
								authData,
							);
						}
					} else if (operation === 'delete') {
						const params = { id: this.getNodeParameter('listId', i) as number };
						if (dryRun) {
							responseData = { dryRun: true, command: 'deleteStockList', params };
						} else if (!confirm) {
							throw new NodeOperationError(
								this.getNode(),
								'Refusing to delete watchlist without confirm=true',
								{ itemIndex: i },
							);
						} else {
							responseData = await makeRequest.call(
								this,
								'deleteStockList',
								params,
								authentication,
								authData,
							);
						}
					} else if (operation === 'select')
						responseData = await makeRequest.call(
							this,
							'makeStockListSelected',
							{ id: this.getNodeParameter('listId', i) as number },
							authentication,
							authData,
						);
					else if (operation === 'addTicker') {
						const index = this.getNodeParameter('index', i) as number;
						const payload: IDataObject = {
							id: this.getNodeParameter('listId', i) as number,
							ticker: this.getNodeParameter('ticker', i) as string,
						};
						if (index !== undefined) payload.index = index;

						if (dryRun) {
							responseData = { dryRun: true, command: 'addStockListTicker', params: payload };
						} else if (!confirm) {
							throw new NodeOperationError(
								this.getNode(),
								'Refusing to add ticker without confirm=true',
								{ itemIndex: i },
							);
						} else {
							responseData = await makeRequest.call(
								this,
								'addStockListTicker',
								payload,
								authentication,
								authData,
							);
						}
					} else if (operation === 'removeTicker') {
						const payload: IDataObject = {
							id: this.getNodeParameter('listId', i) as number,
							ticker: this.getNodeParameter('ticker', i) as string,
						};
						if (dryRun) {
							responseData = { dryRun: true, command: 'deleteStockListTicker', params: payload };
						} else if (!confirm) {
							throw new NodeOperationError(
								this.getNode(),
								'Refusing to remove ticker without confirm=true',
								{ itemIndex: i },
							);
						} else {
							responseData = await makeRequest.call(
								this,
								'deleteStockListTicker',
								payload,
								authentication,
								authData,
							);
						}
					}
				} else if (resource === 'security') {
					if (operation === 'getInfo')
						responseData = await makeRequest.call(
							this,
							'getSecurityInfo',
							{ ticker: this.getNodeParameter('ticker', i) as string, sup: true },
							authentication,
							authData,
						);
					else if (operation === 'getAll') {
						const take = this.getNodeParameter('take', i, 50) as number;
						const skip = this.getNodeParameter('skip', i, 0) as number;
						const filters = JSON.parse(this.getNodeParameter('filtersJson', i, '[]') as string);
						const sort = JSON.parse(this.getNodeParameter('sortJson', i, '[]') as string);
						const payload: IDataObject = { take, skip };
						if (filters.length > 0) payload.filter = { filters };
						if (sort.length > 0) payload.sort = sort;

						responseData = await makeRequest.call(
							this,
							'getAllSecurities',
							payload,
							authentication,
							authData,
						);
					} else if (operation === 'getTop') {
						const limit = this.getNodeParameter('limit', i, 10) as number;
						responseData = await makeRequest.call(
							this,
							'getTopSecurities',
							{ limit },
							authentication,
							authData,
						);
					}
				} else if (resource === 'history') {
					const from = this.getNodeParameter('from', i) as string;
					const till = this.getNodeParameter('till', i) as string;
					if (operation === 'getOrders')
						responseData = await makeRequest.call(
							this,
							'getOrdersHistory',
							{ from, till },
							authentication,
							authData,
						);
					else if (operation === 'getTrades')
						responseData = await makeRequest.call(
							this,
							'getTradesHistory',
							{ beginDate: from.split('T')[0], endDate: till.split('T')[0] },
							authentication,
							authData,
						);
					else if (operation === 'getCashflows') {
						const userId = this.getNodeParameter('userId', i, 0) as number;
						const groupByType = this.getNodeParameter('groupByType', i, false) as boolean;
						const cashTotals = this.getNodeParameter('cashTotals', i, false) as boolean;
						const hideLimits = this.getNodeParameter('hideLimits', i, false) as boolean;
						const take = this.getNodeParameter('take', i, 50) as number;
						const skip = this.getNodeParameter('skip', i, 0) as number;
						const withoutRefund = this.getNodeParameter('withoutRefund', i, false) as boolean;
						const filters = JSON.parse(this.getNodeParameter('filtersJson', i, '[]') as string);
						const sort = JSON.parse(this.getNodeParameter('sortJson', i, '[]') as string);

						const payload: IDataObject = {
							groupByType: groupByType ? 1 : 0,
							cash_totals: cashTotals ? 1 : 0,
							hide_limits: hideLimits ? 1 : 0,
							take,
							skip,
							without_refund: withoutRefund ? 1 : 0,
						};
						if (userId > 0) payload.user_id = userId;
						if (filters.length > 0) payload.filters = filters;
						if (sort.length > 0) payload.sort = sort;

						responseData = await makeRequest.call(
							this,
							'getUserCashFlows',
							payload,
							authentication,
							authData,
						);
					}
				} else if (resource === 'alert') {
					if (operation === 'getAll') {
						const triggered = this.getNodeParameter('triggered', i, false) as boolean;
						const ticker = this.getNodeParameter('ticker', i, '') as string;
						const payload: IDataObject = { triggered };
						if (ticker) payload.ticker = ticker;
						responseData = await makeRequest.call(
							this,
							'getAlertsList',
							payload,
							authentication,
							authData,
						);
					} else if (operation === 'toggle') {
						const del = this.getNodeParameter('deleteAlert', i, false) as boolean;
						const payload: IDataObject = {
							quote_type: this.getNodeParameter('quoteType', i) as string,
							notification_type: this.getNodeParameter('notificationType', i) as string,
						};

						if (del) {
							payload.id = this.getNodeParameter('alertId', i) as number;
							payload.del = true;
						} else {
							payload.ticker = this.getNodeParameter('ticker', i) as string;
							payload.price = { price: String(this.getNodeParameter('price', i) as number) };
							payload.trigger_type = this.getNodeParameter('triggerType', i) as string;
							payload.alert_period = this.getNodeParameter('alertPeriod', i) as number;
							payload.expire = this.getNodeParameter('expire', i) as number;
						}

						if (dryRun) {
							responseData = { dryRun: true, command: 'togglePriceAlert', params: payload };
						} else if (!confirm) {
							throw new NodeOperationError(
								this.getNode(),
								'Refusing to toggle alert without confirm=true',
								{ itemIndex: i },
							);
						} else {
							responseData = await makeRequest.call(
								this,
								'togglePriceAlert',
								payload,
								authentication,
								authData,
							);
						}
					}
				} else if (resource === 'fx') {
					if (operation === 'getRates')
						responseData = await makeRequest.call(
							this,
							'getCrossRatesForDate',
							{
								base_currency: this.getNodeParameter('baseCurrency', i) as string,
								currencies: (this.getNodeParameter('currencies', i) as string)
									.split(',')
									.map((c) => c.trim()),
							},
							authentication,
							authData,
						);
				} else if (resource === 'dynamic') {
					if (operation === 'call') {
						const command = this.getNodeParameter('command', i) as string;
						const params = JSON.parse(this.getNodeParameter('parametersJson', i, '{}') as string);
						if (dryRun) {
							responseData = { dryRun: true, command, params };
						} else if (
							!confirm &&
							['put', 'delete', 'add', 'update', 'toggle', 'make'].some((kw) =>
								command.toLowerCase().includes(kw),
							)
						) {
							throw new NodeOperationError(
								this.getNode(),
								`Command ${command} might be a mutation. Please set confirm=true.`,
								{ itemIndex: i },
							);
						} else {
							responseData = await makeRequest.call(
								this,
								'callCommand',
								{ command, parameters: params },
								authentication,
								authData,
							);
						}
					}
				}

				const executionData = this.helpers.returnJsonArray(responseData as IDataObject[]);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw error;
			}
		}
		return [returnData];
	}
}

async function getSessionId(
	this: IExecuteFunctions,
	login: string,
	password: string,
): Promise<string> {
	let response;
	try {
		response = await this.helpers.httpRequest({
			method: 'POST',
			url: 'https://tradernet.com/api/check-login-password',
			body: {
				login,
				password,
				rememberMe: 1,
			},
			returnFullResponse: true,
		});
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as unknown as JsonObject, {
			message: 'Login failed',
		});
	}

	if (response.statusCode !== 200) {
		throw new NodeApiError(this.getNode(), response as unknown as JsonObject, {
			message: 'Login failed: Invalid credentials or server error',
		});
	}

	const setCookie = response.headers['set-cookie'];
	if (!setCookie) {
		throw new NodeOperationError(this.getNode(), 'Login failed: No session cookie received');
	}

	const cookies = Array.isArray(setCookie) ? setCookie.join(';') : setCookie;
	const match = cookies.match(/SID=([^;]+)/);
	if (!match) {
		throw new NodeOperationError(this.getNode(), 'Login failed: Could not extract Session ID');
	}

	return match[1];
}

async function makeRequest(
	this: IExecuteFunctions,
	command: string,
	params: IDataObject,
	authType: string,
	authData: IDataObject,
	useV2 = false,
) {
	if (authType === 'apiKey') {
		const payload = JSON.stringify(params);
		const timestamp = Math.floor(Date.now() / 1000);
		const signature = crypto
			.createHmac('sha256', authData.privateKey as string)
			.update(payload + timestamp)
			.digest('hex');
		const headers = {
			'Content-Type': 'application/json',
			'X-NtApi-PublicKey': authData.publicKey as string,
			'X-NtApi-Timestamp': timestamp.toString(),
			'X-NtApi-Sig': signature,
		};
		const baseUrl = useV2 ? 'https://tradernet.com/api/v2' : 'https://tradernet.com/api';
		const url = useV2 ? `${baseUrl}/cmd/${command}` : `${baseUrl}/${command}`;
		const response = await this.helpers.httpRequest({
			method: 'POST',
			url,
			body: payload,
			headers,
		});
		return typeof response === 'string' ? JSON.parse(response) : response;
	} else {
		// User Login (Session)
		const requestBody = {
			cmd: command,
			params,
			SID: authData.sid,
		};
		const url = 'https://tradernet.com/api';
		const qs = { q: JSON.stringify(requestBody) };

		const response = await this.helpers.httpRequest({
			method: 'POST',
			url,
			qs,
			headers: { 'Content-Type': 'application/json' },
		});
		return typeof response === 'string' ? JSON.parse(response) : response;
	}
}
