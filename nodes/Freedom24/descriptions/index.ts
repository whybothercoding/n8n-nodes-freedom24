import { INodeProperties } from 'n8n-workflow';

import { authenticationProperty, resourceProperty } from './Common.description';
import { portfolioOperation, portfolioFields } from './Portfolio.description';
import { quoteOperation, quoteFields } from './Quote.description';
import { orderOperation, orderFields } from './Order.description';
import { marketOperation, marketFields } from './Market.description';
import { watchlistOperation, watchlistFields } from './Watchlist.description';
import { securityOperation, securityFields } from './Security.description';
import { historyOperation, historyFields } from './History.description';
import { alertOperation, alertFields } from './Alert.description';
import { fxOperation, fxFields } from './Fx.description';
import { dynamicOperation, dynamicFields } from './Dynamic.description';

export const freedom24Properties: INodeProperties[] = [
	authenticationProperty,
	resourceProperty,
	portfolioOperation,
	quoteOperation,
	orderOperation,
	marketOperation,
	watchlistOperation,
	securityOperation,
	historyOperation,
	alertOperation,
	fxOperation,
	dynamicOperation,
	...portfolioFields,
	...quoteFields,
	...orderFields,
	...marketFields,
	...watchlistFields,
	...securityFields,
	...historyFields,
	...alertFields,
	...fxFields,
	...dynamicFields,
];
