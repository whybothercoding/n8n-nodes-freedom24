# Project Context: n8n-nodes-freedom24 (Tradernet API)

## 1. Overview
| Key | Value |
| :--- | :--- |
| **Project Name** | n8n-nodes-freedom24 |
| **Purpose** | Native n8n community node for interacting with the Freedom24 (Tradernet) Trading API. |
| **Source** | Migrated from the custom \`freedom-mcp-server\` Node project. |
| **Status** | Production-ready with all core API functions implemented. |
| **Git URL** | https://github.com/whybothercoding/n8n-nodes-freedom24 (Private) |

## 2. Technical Migration Summary
The functionality was migrated from a custom Model Context Protocol (MCP) server directly into a programmatic n8n node structure to eliminate external dependencies and simplify deployment.

| Feature | MCP Equivalent | Implementation Note |
| :--- | :--- | :--- |
| **Authentication** | HMAC-SHA256 Sig Generation | Implemented in \`makeRequest\` helper function within \`Freedom24.node.ts\`. |
| **Data Mapping** | Zod Schemas | Translated to \`INodeProperties\` for UI and casting within \`execute\` method. |
| **Execution** | Tool Handlers | Logic ported to \`execute\` function with full API coverage. |

## 3. Deployment and Maintenance
| Key | Value |
| :--- | :--- |
| **Environment** | Self-hosted n8n on GCP VM (\`n8n.indiegoweb.com\`) |
| **Node Location** | \`~/.n8n/nodes/node_modules/n8n-nodes-freedom24\` |
| **Deployment Method**| SCP tarball of \`dist\` and \`package.json\`, followed by \`sudo systemctl restart n8n\`. |
| **Local Build Command**| \`npm run build\` |
| **Build Directory** | \`dist/\` |

## 4. Implemented Node Features (API Coverage)
The node includes comprehensive resources, ensuring all trading-assistant needs are met:

| Resource | Key Operations |
| :--- | :--- |
| **Portfolio** | Get All (Balances & Positions) |
| **Quote** | Get, Get Many, Get History (Candlesticks), Search |
| **Order** | Get All, Place (Market/Limit, with TP/SL), Cancel, Update Protection, Bulk Cancel |
| **Watchlist** | Get All, Create, Delete, Add/Remove Ticker |
| **History** | Get Orders, Get Trades, Get Cashflows |
| **Alert** | Get All, Toggle (Price Alerts) |
| **Security/FX**| Get Info, Get All Securities, Get Cross Rates |
| **Dynamic** | Call any raw Tradernet API command. |

## 5. Testing & Verification
| Key | Value |
| :--- | :--- |
| **Test Workflow** | \`test_workflow.json\` (Local file) |
| **Test Chain** | \`Manual Trigger -> Freedom24 (Portfolio: Get All) -> Google Gemini (Analysis)\` |
| **Verification** | Node successfully built, deployed, and loaded in n8n UI. Functional verification requires API keys. |
