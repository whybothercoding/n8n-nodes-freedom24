# n8n-nodes-freedom24

[![CI](https://github.com/whybothercoding/n8n-nodes-freedom24/actions/workflows/ci.yml/badge.svg)](https://github.com/whybothercoding/n8n-nodes-freedom24/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/%40indiegoweb%2Fn8n-nodes-freedom24.svg)](https://www.npmjs.com/package/@indiegoweb/n8n-nodes-freedom24)
[![npm provenance](https://img.shields.io/badge/npm%20provenance-verified-brightgreen)](https://www.npmjs.com/package/@indiegoweb/n8n-nodes-freedom24)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE.md)

This is an n8n community node. It lets you use the Freedom24 (Tradernet) API in your n8n workflows.

Freedom24 is a trading platform by Freedom Finance, providing access to global stock markets. This node allows you to interact with the Tradernet API to manage your portfolio, orders, and market data.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[Safety model](#safety-model)
[AI agent readiness](#ai-agent-readiness)
[Known limitations](#known-limitations)
[Architecture](#architecture)
[Compatibility](#compatibility)
[Resources](#resources)
[Development](#development)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

The node supports the following operations organized by resource:

- **Portfolio** — Get current positions and account balances.
- **Quote** — Get real-time quotes (single/many), historical candlesticks (OHLCV), and search for tickers.
- **Order**
  - **Place** — Market and Limit orders with optional Take Profit, Stop Loss (price/percent), Trailing Stop, and Expiration settings.
  - **Cancel** — Cancel an individual order.
  - **Bulk Cancel** — Cancel multiple orders; each is settled independently and reported on its own, so one failure doesn't hide the rest.
  - **Update Protection** — Modify TP/SL and trailing settings for an existing position.
  - **Get Many** — List active orders.
- **Watchlist** — Create, update, delete, select, and manage tickers in custom watchlists.
- **History**
  - **Orders** — Full order history within a date range.
  - **Trades** — Executed trades history.
  - **Cashflows** — Cash movement history with filtering, sorting, and pagination.
- **Security**
  - **Get Info** — Detailed instrument information.
  - **Get Many** — Query the full securities directory with JSON filters/sorting.
  - **Get Top** — Most traded / fastest-growing securities.
- **Alert** — List, create, and delete price alerts.
- **FX** — Cross rates for multiple currencies, optionally for a historical date.
- **Market** — Market open/close statuses.
- **Dynamic** — Call any raw Tradernet API command with custom JSON parameters.

The **Ticker** field is a searchable resourceLocator — type a symbol directly, or search by name and pick from live results. **Simplify** (on by default for Portfolio, Quote, and the list-returning Order/Watchlist operations) unwraps Tradernet's response envelope and returns one n8n item per record instead of one item wrapping a raw array; turn it off to see the exact API response.

## Credentials

This node supports two methods of authentication:

1. **API Key** — a Public Key and Private Key, HMAC-signed per request. Recommended for automated workflows.
2. **User Login** — your Freedom24 email and password. The node logs in and manages the session automatically. Not supported for accounts that require SMS/2FA confirmation on login — use API Key auth for those.

Both credential types run a real connection test (an HMAC-signed probe for API Key, an actual login attempt for User Login) rather than an unauthenticated ping, so "Test" in the credential editor genuinely tells you whether the credentials work.

## Safety model

Every operation that mutates account state (placing/cancelling orders, updating protection, watchlist writes, toggling alerts, and any `dynamic.call` that looks like a mutation) requires either:

- **Dry Run** — returns the exact request payload without sending it, so you can preview what would happen, or
- **Confirm** — set to `true` to actually send the request.

`dynamic.call` additionally checks the command name against a conservative, prefix-based mutation heuristic (`put`, `delete`/`del`, `add`, `update`, `toggle`, `make`, `cancel`, `remove`, `create`, `set`, `save`, `edit`) and requires Confirm for anything that matches. It only ever *adds* a confirmation requirement — it never skips the check for a command it doesn't recognize.

## AI Agent Readiness

This node is optimized for use as a tool in AI Agent workflows (e.g., using n8n's AI Agent node):

- **Tool Enabled** — `usableAsTool: true` is set.
- **Descriptive metadata** — properties include verbose descriptions to help LLMs understand expected formats (e.g., `AAPL.US`).
- **Safety first** — mutating operations require `confirm: true` or `dryRun: true` (see [Safety model](#safety-model)).
- **Dry run support** — returns the prepared API payload for "pre-flight" validation by an agent.

## Known limitations

- **News** — Tradernet's news endpoint (`get_news`) currently returns "Command not found" for every caller due to regional/server restrictions on the vendor's side, so no News resource is exposed here.
- **SMS/2FA login** — User Login authentication does not support the SMS confirmation flow some accounts require. Use API Key authentication for those accounts.
- **`security.getTop`** — Tradernet also accepts `type`/`exchange`/`gainers` filters on this endpoint; only `limit` is currently exposed, and the API applies its own defaults for the rest.

## Architecture

```
nodes/Freedom24/
  Freedom24.node.ts    Node description assembly, execute() loop, methods{}
  descriptions/        Per-resource property definitions
  actions/              Per-resource operation handlers + the router dispatch point
  transport/            HMAC signing, endpoint resolution/fallback, session login
  helpers/              Pure payload builders, response unwrapping, guarded JSON parsing
  methods/              Real credentialTest probes, Ticker's listSearch
```

Payload construction lives in pure functions with no `IExecuteFunctions` dependency (`helpers/`), which is what makes them directly unit-testable — see [Development](#development).

## Compatibility

Built against `n8n-workflow ^2.1.0`. Requires Node.js ≥ 20.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Tradernet API Documentation](https://tradernet.com/tradernet-api)

## Development

### Commands

- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Fix Lint**: `npm run lint:fix`
- **Watch**: `npm run build:watch`
- **Test**: `npm test` — Vitest, fully offline (no live API calls; see below)
- **Type check**: `npm run typecheck`

### Testing

The suite covers the pure helpers directly (HMAC signing, every payload builder, response
unwrapping, JSON parsing, the mutation-command heuristic), the transport layer's endpoint
resolution and fallback ordering via a hand-rolled `HttpContext` fake, and the action layer's
confirm/dry-run gating and error handling via a minimal `IExecuteFunctions` fake. Nothing in the
suite makes a network call — it's safe to run against a repo with no configured credentials at
all, including in CI.

### Code Style

- Use **Tabs** for indentation.
- Use **Single Quotes** for strings.
- Follow the **Resource -> Operation** pattern for the node structure.
- Always include `confirm` and `dryRun` parameters for operations that modify state.
