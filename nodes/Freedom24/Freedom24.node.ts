import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
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
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Portfolio', value: 'portfolio' },
					{ name: 'Quote', value: 'quote' },
					{ name: 'Order', value: 'order' },
					{ name: 'Market', value: 'market' },
					{ name: 'Watchlist', value: 'watchlist' },
					{ name: 'Security', value: 'security' },
					{ name: 'History', value: 'history' },
					{ name: 'Alert', value: 'alert' },
					{ name: 'FX', value: 'fx' },
					{ name: 'Dynamic', value: 'dynamic' },
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
					{ name: 'Get All', value: 'getAll', description: 'Get current portfolio positions and account balances', action: 'Get portfolio' },
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
					{ name: 'Get', value: 'get', description: 'Get real-time quote for a ticker', action: 'Get a quote' },
					{ name: 'Get Many', value: 'getMany', description: 'Get real-time quotes for multiple tickers', action: 'Get many quotes' },
					{ name: 'Get History', value: 'getHistory', description: 'Get historical OHLCV data', action: 'Get candlesticks' },
					{ name: 'Search', value: 'search', description: 'Search for tickers', action: 'Search tickers' },
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
					{ name: 'Get All', value: 'getAll', description: 'Get list of current/active orders', action: 'Get all orders' },
					{ name: 'Place', value: 'place', description: 'Place a new order', action: 'Place an order' },
					{ name: 'Cancel', value: 'cancel', description: 'Cancel an existing order', action: 'Cancel an order' },
					{ name: 'Update Protection', value: 'updateProtection', description: 'Update TP/SL for a ticker', action: 'Update protection' },
					{ name: 'Bulk Cancel', value: 'bulkCancel', description: 'Cancel multiple orders', action: 'Bulk cancel' },
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
					{ name: 'Get Status', value: 'getStatus', description: 'Get market open/close statuses', action: 'Get market status' },
				],
				default: 'getStatus',
			},
			// Watchlist Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['watchlist'] } },
				options: [
					{ name: 'Get All', value: 'getAll', description: 'Get all saved watchlists', action: 'Get watchlists' },
					{ name: 'Create', value: 'create', description: 'Create a new watchlist', action: 'Create watchlist' },
					{ name: 'Delete', value: 'delete', description: 'Delete a watchlist', action: 'Delete watchlist' },
					{ name: 'Add Ticker', value: 'addTicker', description: 'Add ticker to watchlist', action: 'Add ticker' },
					{ name: 'Remove Ticker', value: 'removeTicker', description: 'Remove ticker from watchlist', action: 'Remove ticker' },
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
					{ name: 'Get Info', value: 'getInfo', description: 'Get instrument details', action: 'Get security info' },
					{ name: 'Get All', value: 'getAll', description: 'Query the full securities directory', action: 'Get all securities' },
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
					{ name: 'Get Orders', value: 'getOrders', description: 'Get orders history', action: 'Get orders history' },
					{ name: 'Get Trades', value: 'getTrades', description: 'Get trades history', action: 'Get trades history' },
					{ name: 'Get Cashflows', value: 'getCashflows', description: 'Get cash movement history', action: 'Get cashflows' },
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
					{ name: 'Get All', value: 'getAll', description: 'List price alerts', action: 'Get alerts' },
					{ name: 'Toggle', value: 'toggle', description: 'Create or delete a price alert', action: 'Toggle alert' },
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
					{ name: 'Get Rates', value: 'getRates', description: 'Get FX cross rates', action: 'Get cross rates' },
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
					{ name: 'Call', value: 'call', description: 'Call any API command', action: 'Dynamic call' },
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
						resource: ['quote', 'order', 'watchlist', 'security', 'alert'],
						operation: ['get', 'getHistory', 'place', 'updateProtection', 'addTicker', 'removeTicker', 'getInfo', 'toggle'],
					},
				},
				default: '',
				required: true,
				placeholder: 'AAPL.US',
			},
			{
				displayName: 'Tickers',
				name: 'tickers',
				type: 'string',
				displayOptions: { show: { resource: ['quote'], operation: ['getMany'] } },
				default: '',
				required: true,
				description: 'Comma-separated list of tickers',
			},
			{
				displayName: 'Interval',
				name: 'interval',
				type: 'options',
				displayOptions: { show: { resource: ['quote'], operation: ['getHistory'] } },
				options: [
					{ name: '1 Minute', value: '1M' }, { name: '5 Minutes', value: '5M' }, { name: '15 Minutes', value: '15M' },
					{ name: '30 Minutes', value: '30M' }, { name: '1 Hour', value: '1H' }, { name: '4 Hours', value: '4H' },
					{ name: '1 Day', value: '1D' }, { name: '1 Week', value: '1W' },
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
				displayName: 'Query',
				name: 'query',
				type: 'string',
				displayOptions: { show: { resource: ['quote'], operation: ['search'] } },
				default: '',
				required: true,
			},
			{
				displayName: 'Side',
				name: 'side',
				type: 'options',
				displayOptions: { show: { resource: ['order'], operation: ['place'] } },
				options: [ { name: 'Buy', value: 'buy' }, { name: 'Sell', value: 'sell' } ],
				default: 'buy',
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				displayOptions: { show: { resource: ['order'], operation: ['place'] } },
				options: [ { name: 'Market', value: 'market' }, { name: 'Limit', value: 'limit' } ],
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
			},
			{
				displayName: 'List ID',
				name: 'listId',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['watchlist'],
						operation: ['delete', 'addTicker', 'removeTicker'],
					},
				},
				default: 0,
				required: true,
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				displayOptions: { show: { resource: ['watchlist'], operation: ['create'] } },
				default: '',
				required: true,
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
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const credentials = await this.getCredentials('freedom24Api');
		const publicKey = credentials.publicKey as string;
		const privateKey = credentials.privateKey as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData;

				if (resource === 'portfolio') {
					if (operation === 'getAll') {
						responseData = await makeRequest.call(this, 'getOPQ', {}, publicKey, privateKey);
					}
				} else if (resource === 'quote') {
					if (operation === 'get') {
						const ticker = this.getNodeParameter('ticker', i) as string;
						responseData = await makeRequest.call(this, 'getStockQuotesJson', { tickers: [ticker] }, publicKey, privateKey);
					} else if (operation === 'getMany') {
						const tickers = (this.getNodeParameter('tickers', i) as string).split(',').map(t => t.trim());
						responseData = await makeRequest.call(this, 'getStockQuotesJson', { tickers }, publicKey, privateKey);
					} else if (operation === 'getHistory') {
						const ticker = this.getNodeParameter('ticker', i) as string;
						const interval = this.getNodeParameter('interval', i) as string;
						const count = this.getNodeParameter('count', i) as number;
						const timeframeMap: Record<string, number> = { '1M': 1, '5M': 5, '15M': 15, '30M': 30, '1H': 60, '4H': 240, '1D': 1440, '1W': 10080 };
						responseData = await makeRequest.call(this, 'getHloc', { id: ticker, timeframe: timeframeMap[interval] || 1440, count }, publicKey, privateKey);
					} else if (operation === 'search') {
						const query = this.getNodeParameter('query', i) as string;
						responseData = await makeRequest.call(this, 'tickerFinder', { text: query }, publicKey, privateKey);
					}
				} else if (resource === 'order') {
					if (operation === 'getAll') {
						responseData = await makeRequest.call(this, 'getNotifyOrderJson', {}, publicKey, privateKey);
					} else if (operation === 'place') {
						const ticker = this.getNodeParameter('ticker', i) as string;
						const side = this.getNodeParameter('side', i) as string;
						const type = this.getNodeParameter('type', i) as string;
						const quantity = this.getNodeParameter('quantity', i) as number;
						const orderParams: any = { instr_name: ticker, action_id: side === 'buy' ? 1 : 3, order_type_id: type === 'market' ? 1 : 2, qty: quantity };
						if (type === 'limit') orderParams.limit_price = this.getNodeParameter('price', i) as number;
						const tp = this.getNodeParameter('takeProfit', i) as number;
						const sl = this.getNodeParameter('stopLoss', i) as number;
						if (tp > 0) orderParams.take_profit = tp;
						if (sl > 0) orderParams.stop_loss = sl;
						responseData = await makeRequest.call(this, 'putOrderV2', orderParams, publicKey, privateKey, true);
					} else if (operation === 'cancel') {
						const orderId = this.getNodeParameter('orderId', i) as string;
						responseData = await makeRequest.call(this, 'deleteOrder', { order_id: orderId }, publicKey, privateKey);
					} else if (operation === 'updateProtection') {
						const ticker = this.getNodeParameter('ticker', i) as string;
						const tp = this.getNodeParameter('takeProfit', i) as number;
						const sl = this.getNodeParameter('stopLoss', i) as number;
						const payload: any = { instr_name: ticker, expiration_id: 3 };
						if (tp > 0) payload.take_profit = tp;
						if (sl > 0) payload.stop_loss = sl;
						responseData = await makeRequest.call(this, 'putStopLoss', payload, publicKey, privateKey, true);
					} else if (operation === 'bulkCancel') {
						const ids = (this.getNodeParameter('orderIds', i) as string).split(',').map(id => id.trim());
						responseData = await Promise.all(ids.map(id => makeRequest.call(this, 'deleteOrder', { order_id: id }, publicKey, privateKey)));
					}
				} else if (resource === 'market') {
					if (operation === 'getStatus') responseData = await makeRequest.call(this, 'getMarketStatus', { market: '*' }, publicKey, privateKey);
				} else if (resource === 'watchlist') {
					if (operation === 'getAll') responseData = await makeRequest.call(this, 'getUserStockLists', {}, publicKey, privateKey);
					else if (operation === 'create') responseData = await makeRequest.call(this, 'addStockList', { name: this.getNodeParameter('name', i) as string, tickers: [] }, publicKey, privateKey);
					else if (operation === 'delete') responseData = await makeRequest.call(this, 'deleteStockList', { id: this.getNodeParameter('listId', i) as number }, publicKey, privateKey);
					else if (operation === 'addTicker') responseData = await makeRequest.call(this, 'addStockListTicker', { id: this.getNodeParameter('listId', i) as number, ticker: this.getNodeParameter('ticker', i) as string }, publicKey, privateKey);
					else if (operation === 'removeTicker') responseData = await makeRequest.call(this, 'deleteStockListTicker', { id: this.getNodeParameter('listId', i) as number, ticker: this.getNodeParameter('ticker', i) as string }, publicKey, privateKey);
				} else if (resource === 'security') {
					if (operation === 'getInfo') responseData = await makeRequest.call(this, 'getSecurityInfo', { ticker: this.getNodeParameter('ticker', i) as string, sup: true }, publicKey, privateKey);
					else if (operation === 'getAll') responseData = await makeRequest.call(this, 'getAllSecurities', {}, publicKey, privateKey);
				} else if (resource === 'history') {
					const from = this.getNodeParameter('from', i) as string;
					const till = this.getNodeParameter('till', i) as string;
					if (operation === 'getOrders') responseData = await makeRequest.call(this, 'getOrdersHistory', { from, till }, publicKey, privateKey);
					else if (operation === 'getTrades') responseData = await makeRequest.call(this, 'getTradesHistory', { beginDate: from.split('T')[0], endDate: till.split('T')[0] }, publicKey, privateKey);
					else if (operation === 'getCashflows') responseData = await makeRequest.call(this, 'getUserCashFlows', {}, publicKey, privateKey);
				} else if (resource === 'alert') {
					if (operation === 'getAll') responseData = await makeRequest.call(this, 'getAlertsList', {}, publicKey, privateKey);
					else if (operation === 'toggle') responseData = await makeRequest.call(this, 'togglePriceAlert', { ticker: this.getNodeParameter('ticker', i) as string, price: { price: String(this.getNodeParameter('price', i) as number) }, trigger_type: 'last_more', quote_type: 'ltp', notification_type: 'email' }, publicKey, privateKey);
				} else if (resource === 'fx') {
					if (operation === 'getRates') responseData = await makeRequest.call(this, 'getCrossRatesForDate', { base_currency: this.getNodeParameter('baseCurrency', i) as string, currencies: (this.getNodeParameter('currencies', i) as string).split(',').map(c => c.trim()) }, publicKey, privateKey);
				} else if (resource === 'dynamic') {
					if (operation === 'call') responseData = await makeRequest.call(this, 'callCommand', { command: this.getNodeParameter('command', i) as string, parameters: JSON.parse(this.getNodeParameter('parametersJson', i) as string) }, publicKey, privateKey);
				}

				const executionData = this.helpers.returnJsonArray(responseData as any);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw error;
			}
		}
		return [returnData];
	}
}

async function makeRequest(this: IExecuteFunctions, command: string, params: any, publicKey: string, privateKey: string, useV2 = false) {
	const payload = JSON.stringify(params);
	const timestamp = Math.floor(Date.now() / 1000);
	const signature = crypto.createHmac('sha256', privateKey).update(payload + timestamp).digest('hex');
	const headers = { 'Content-Type': 'application/json', 'X-NtApi-PublicKey': publicKey, 'X-NtApi-Timestamp': timestamp.toString(), 'X-NtApi-Sig': signature };
	const baseUrl = useV2 ? 'https://tradernet.com/api/v2' : 'https://tradernet.com/api';
	const url = useV2 ? `${baseUrl}/cmd/${command}` : `${baseUrl}/${command}`;
	// @ts-ignore
	const response = await this.helpers.request( { method: 'POST', url, body: payload, headers });
	return typeof response === 'string' ? JSON.parse(response) : response;
}
