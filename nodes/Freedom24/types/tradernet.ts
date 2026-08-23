/**
 * Shapes returned by the Tradernet API. Kept intentionally loose (IDataObject-based) because
 * the API is not formally typed upstream and several endpoints return differently-shaped
 * envelopes depending on account state (see helpers/responses.ts for the unwrapping logic).
 */

import { IDataObject } from 'n8n-workflow';

export interface ApiErrorEnvelope {
	error?: string;
	errMsg?: string;
}

export interface Quote extends IDataObject {
	c?: string; // ticker code
	name?: string;
	ltp?: number; // last traded price
	bbp?: number; // best bid price
	bap?: number; // best ask price
	chg?: number; // change
	pcp?: number; // percent change
}

export interface Candlestick extends IDataObject {
	t?: number; // timestamp
	o?: number; // open
	h?: number; // high
	l?: number; // low
	c?: number; // close
	v?: number; // volume
}

export interface PortfolioPosition extends IDataObject {
	i?: string; // instrument name/ticker
	q?: number; // quantity
	price_ask?: number;
	price_bid?: number;
}

export interface OrderRecord extends IDataObject {
	id?: string | number;
	instr?: string;
	action?: number;
	status?: string | number;
}

export interface WatchlistRecord extends IDataObject {
	id?: number;
	name?: string;
	tickers?: string[];
}
