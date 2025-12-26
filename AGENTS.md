# Project Context: n8n-nodes-freedom24 (Tradernet API)

## 1. Overview

| Key              | Value                                                                                 |
| :--------------- | :------------------------------------------------------------------------------------ |
| **Project Name** | n8n-nodes-freedom24                                                                   |
| **Purpose**      | Native n8n community node for interacting with the Freedom24 (Tradernet) Trading API. |
| **Source**       | Migrated from the custom \`freedom-mcp-server\` Node project.                         |
| **Status**       | Production-ready with all core API functions implemented.                             |
| **Git URL**      | https://github.com/whybothercoding/n8n-nodes-freedom24 (Private)                      |

## 2. Technical Migration Summary

The functionality was migrated from a custom Model Context Protocol (MCP) server directly into a programmatic n8n node structure to eliminate external dependencies and simplify deployment.

| Feature            | MCP Equivalent             | Implementation Note                                                             |
| :----------------- | :------------------------- | ------------------------------------------------------------------------------- |
| **Authentication** | HMAC-SHA256 Sig Generation | Implemented in \`makeRequest\` helper function within \`Freedom24.node.ts\`.    |
| **Data Mapping**   | Zod Schemas                | Translated to \`INodeProperties\` for UI and casting within \`execute\` method. |
| **Execution**      | Tool Handlers              | Logic ported to \`execute\` function with full API coverage.                    |

## 3. Deployment and Maintenance

| Key                     | Value                                                                                     |
| :---------------------- | :---------------------------------------------------------------------------------------- |
| **Environment**         | Self-hosted n8n on GCP VM (\`n8n.indiegoweb.com\`)                                        |
| **Node Location**       | \`~/.n8n/nodes/node_modules/n8n-nodes-freedom24\`                                         |
| **Deployment Method**   | SCP tarball of \`dist\` and \`package.json\`, followed by \`sudo systemctl restart n8n\`. |
| **Local Build Command** | \`npm run build\`                                                                         |
| **Build Directory**     | \`dist/\`                                                                                 |

## 4. Implemented Node Features (API Coverage)

The node includes comprehensive resources, ensuring all trading-assistant needs are met:

| Resource        | Key Operations                                                                    |
| :-------------- | :-------------------------------------------------------------------------------- |
| **Portfolio**   | Get All (Balances & Positions)                                                    |
| **Quote**       | Get, Get Many, Get History (Candlesticks), Search                                 |
| **Order**       | Get All, Place (Market/Limit, with TP/SL), Cancel, Update Protection, Bulk Cancel |
| **Watchlist**   | Get All, Create, Delete, Add/Remove Ticker                                        |
| **History**     | Get Orders, Get Trades, Get Cashflows                                             |
| **Alert**       | Get All, Toggle (Price Alerts)                                                    |
| **Security/FX** | Get Info, Get All Securities, Get Cross Rates                                     |
| **Dynamic**     | Call any raw Tradernet API command.                                               |

## 5. Testing & Verification

| Key               | Value                                                                                               |
| :---------------- | :-------------------------------------------------------------------------------------------------- |
| **Test Workflow** | \`test_workflow.json\` (Local file)                                                                 |
| **Test Chain**    | \`Manual Trigger -> Freedom24 (Portfolio: Get All) -> Google Gemini (Analysis)\`                    |
| **Verification**  | Node successfully built, deployed, and loaded in n8n UI. Functional verification requires API keys. |

## Session Summary: 2025-12-26 - Software Development & Debugging

### 1. Session Context

- **Session Type**: Software Development & Debugging
- **Main Objectives**: Prepare the `n8n-nodes-freedom24` project for production by fixing all outstanding issues, successfully building the project, and creating a deployable bundle.
- **Date**: 2025-12-26

### 2. Key Accomplishments

- **Fixed TypeScript Error**: Resolved a type issue in `credentials/Freedom24Api.credentials.ts` by adding `as const` to the `icon` property.
- **Corrected Linting Issues**: Ran `npm run lint:fix` to auto-correct several issues and manually added the required `icon` and `testedBy` properties to `credentials/Freedom24UserApi.credentials.ts`.

### 3. Technical/Domain-Specific Details

- **Technologies Used**: TypeScript, Node.js, n8n Node Development Framework.
- **Key Challenge**: The primary blocker is a TypeScript error within the n8n framework's `this.helpers.httpRequest` function. The `IHttpRequestOptions` type definition does not officially support the `resolveWithFullResponse` property, which is required to access response headers for session management.
- **Build Process**: The project enforces a strict `npm run build` and `npm run lint` process, which must pass before changes can be considered complete.

### 4. User Preferences & Working Style

- The user prefers a structured, systematic workflow: identify a problem (usually via a build or lint error), analyze it, propose and implement a fix, and then verify.
- Instructions are clear, detailed, and goal-oriented.

### 5. Thought Processes & Reasoning

- The debugging process was iterative. We attempted to build, located the first error, fixed it, and repeated the cycle.
- For the blocking `resolveWithFullResponse` issue, we correctly deduced that workarounds like `@ts-ignore` were not viable due to the strictness of the local development environment. This points to the need for a framework-compliant solution.

### 6. Patterns & Context for Future Sessions

- **Framework Compliance is Key**: When working with the n8n framework, it is crucial to adhere to its specific type definitions and helper function signatures. Attempting to use properties from the underlying libraries (like `axios`) directly through helpers may not work.
- **Strict Environment**: The build and lint tools are configured to fail on any type or style error, requiring high-quality, compliant code.

### 7. Open Items & Future Considerations

- **Immediate Blocker**: The main unresolved task is to find a way to get the full HTTP response (including headers) from `this.helpers.httpRequest` without causing a TypeScript error. The error is: `Object literal may only specify known properties, and 'resolveWithFullResponse' does not exist in type 'IHttpRequestOptions'`.
- **Planned Next Steps**:
  1. Investigate the `IHttpRequestOptions` and n8n helper documentation to find the correct method for accessing response headers.
  2. Apply the fix in `nodes/Freedom24/Freedom24.node.ts`.
  3. Run `npm run build` to confirm the project builds successfully.
  4. Create a production bundle and prepare for deployment.
