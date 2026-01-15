# n8n-nodes-freedom24

This is an n8n community node. It lets you use the Freedom24 (Tradernet) API in your n8n workflows.

Freedom24 is a trading platform by Freedom Finance, providing access to global stock markets. This node allows you to interact with the Tradernet API to manage your portfolio, orders, and market data.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)
[Compatibility](#compatibility)  
[Resources](#resources)  
[Development](#development)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

The node supports the following operations organized by resource:

- **Portfolio**: Get current positions and account balances.
- **Quote**: Get real-time quotes (single/multiple), historical candlesticks (OHLCV), and search for tickers.
- **Order**:
  - **Place**: Market and Limit orders with optional Take Profit, Stop Loss (Price/Percent), Trailing Stop, and Expiration settings.
  - **Cancel**: Cancel individual or bulk orders.
  - **Update Protection**: Modify TP/SL and trailing settings for existing positions.
  - **Get Many**: List active orders.
- **Watchlist**: Create, update, delete, and manage tickers in custom watchlists.
- **History**:
  - **Orders**: Full history of orders within a date range.
  - **Trades**: Executed trades history.
  - **Cashflows**: Comprehensive cash movement history with filtering, sorting, and pagination.
- **Security**:
  - **Get Info**: Detailed instrument information.
  - **Get Many**: Query the full securities directory with JSON filters/sorting.
  - **Get Top**: Identify most traded or fastest-growing securities.
- **News**: Retrieve market news filtered by ticker or search term.
- **Alert**: Manage price alerts (create, list, delete, toggle).
- **FX**: Get foreign exchange cross rates for multiple currencies.
- **Market**: Check market open/close statuses.
- **Dynamic**: Execute any raw Tradernet API command with custom JSON parameters.

## AI Agent Readiness

This node is optimized for use as a tool in AI Agent workflows (e.g., using n8n's AI Agent node):

- **Tool Enabled**: `usableAsTool: true` is set.
- **Descriptive Meta**: Properties include verbose descriptions to help LLMs understand expected formats (e.g., `AAPL.US`).
- **Safety First**: Mutation operations require `confirm: true` or `dryRun: true`.
- **Dry Run Support**: Returns the prepared API payload for "pre-flight" validation by an agent.

## Credentials

This node supports two methods of authentication:

1.  **API Key**: Authenticate using a Public Key and a Private Key. This is the recommended method for automated workflows.
2.  **User Login**: Authenticate using your Freedom24 username and password. The node will handle the session management automatically.

## Compatibility

This node was built and tested with n8n version 1.x. It should be compatible with all recent versions of n8n.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Tradernet API Documentation](https://tradernet.com/tradernet-api)

## Development

### Commands

- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Fix Lint**: `npm run lint:fix`
- **Watch**: `npm run build:watch`

### Code Style

- Use **Tabs** for indentation.
- Use **Single Quotes** for strings.
- Follow the **Resource -> Operation** pattern for the node structure.
- Always include `confirm` and `dryRun` parameters for operations that modify state.
