# n8n-nodes-freedom24

This is an n8n community node. It lets you use the Freedom24 (Tradernet) API in your n8n workflows.

Freedom24 is a trading platform by Freedom Finance, providing access to global stock markets. This node allows you to interact with the Tradernet API to manage your portfolio, orders, and market data.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)
[Compatibility](#compatibility)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

The node supports the following operations organized by resource:

- **Portfolio**: Get portfolio balances and positions.
- **Quote**: Get real-time quotes, historical data (candlesticks), and search for tickers.
- **Order**: Place, cancel, and get the status of orders. Includes support for bulk cancellation and updating protection orders (TP/SL).
- **Watchlist**: Manage watchlists, including creating, deleting, and adding/removing tickers.
- **History**: Retrieve history for orders, trades, and cashflows.
- **Alert**: List and toggle price alerts.
- **Security/FX**: Get instrument information, a list of all securities, and foreign exchange cross rates.
- **Dynamic**: Make a raw call to any Tradernet API command.

## Credentials

This node supports two methods of authentication:

1.  **API Key**: Authenticate using a Public Key and a Private Key. This is the recommended method for automated workflows.
2.  **User Login**: Authenticate using your Freedom24 username and password. The node will handle the session management automatically.

## Compatibility

This node was built and tested with n8n version 1.x. It should be compatible with all recent versions of n8n.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Tradernet API Documentation](https://tradernet.com/tradernet-api)
