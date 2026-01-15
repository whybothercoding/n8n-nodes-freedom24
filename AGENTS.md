# Agent Instructions for n8n-nodes-freedom24

This repository contains a native n8n community node for the Freedom24 (Tradernet) Trading API. It was migrated from an MCP server and is designed to work both as a workflow node and an AI agent tool.

## 1. Commands

### Build and Lint

- **Build**: `npm run build` (Compiles TS and copies static files to `dist/`)
- **Lint**: `npm run lint` (Checks for style and n8n-specific rules)
- **Fix Lint**: `npm run lint:fix` (Automatically fixes most issues)
- **Watch**: `npm run build:watch` (Automatic recompilation on changes)

### Testing

Automated unit tests are not currently implemented. Verification is performed by:

1. Building the project (`npm run build`).
2. Deploying to a test n8n instance (copying `dist/` and `package.json`).
3. Running a manual trigger workflow.

## 2. Project Structure

- `nodes/Freedom24/Freedom24.node.ts`: Main node logic, UI properties, and API request handling.
- `credentials/Freedom24Api.credentials.ts`: API Key authentication definition.
- `credentials/Freedom24UserApi.credentials.ts`: User Login (Session-based) authentication definition.
- `icons/`: SVG icons for the node.
- `freedom-mcp-server/`: Reference implementation containing API logic and types.

## 3. Code Style Guidelines

### Formatting & Types

- **Indentation**: Use **Tabs** (Mandatory).
- **Quotes**: Use **Single Quotes** for strings.
- **Naming**:
  - Classes: `PascalCase`
  - Variables/Methods: `camelCase`
  - UI Labels: `Title Case` (e.g., `Take Profit`)
- **Types**:
  - Always prefer explicit typing.
  - Use `IDataObject` for general API payloads.
  - Use `JsonObject` when required by n8n error classes.
  - Use `INodeProperties` for UI field definitions.

### Imports

- Group imports: `n8n-workflow` first, then standard libraries, then local files.
- Always include `JsonObject` if using `NodeApiError`.

### Error Handling

- Use `NodeOperationError` for user-facing errors within `execute`.
- **Crucial**: Always provide `{ itemIndex: i }` as the last argument to `NodeOperationError` to help users identify which input failed.
- Use `NodeApiError` for low-level HTTP failures.

```typescript
throw new NodeOperationError(this.getNode(), 'Description of error', { itemIndex: i });
```

### Resource/Operation Pattern

The node follows the standard n8n Resource -> Operation pattern.

- Every field should have `displayOptions` to only show up when the correct resource and operation are selected.
- Use `noDataExpression: true` for Resource and Operation options.

## 4. Trading & AI Agent Readiness

### Mutation Safety

All operations that modify state (Place Order, Cancel, Create Watchlist, etc.) **must** include:

- `confirm`: A boolean toggle to prevent accidental execution.
- `dryRun`: A boolean toggle that returns the request payload without sending it to the API.

### AI Tooling

- The node has `usableAsTool: true`.
- Descriptions for properties should be descriptive enough for an LLM to understand their purpose.
- Tickers should consistently mention the format (e.g., `AAPL.US`).

## 5. API Implementation Notes

- The API uses HMAC signatures for API Key auth. This is implemented in the `makeRequest` helper function.
- Session-based auth (User Login) involves a separate login call and a `SID` cookie extraction.
- Version 2 API calls (`putOrderV2`, `putStopLoss`) use a different base URL (`/api/v2/cmd/`).

## 6. Code Examples

### Standard Request Helper

The node uses a central `makeRequest` function to handle API signatures and communication.

```typescript
async function makeRequest(
	this: IExecuteFunctions,
	command: string,
	params: IDataObject,
	authType: string,
	authData: IDataObject,
	useV2 = false,
) {
	// API Key Auth logic with HMAC signatures
	// User Login Auth logic with SID session cookies
}
```

### Resource Execution Pattern

Logic within the `execute` method is structured by resource and then operation.

```typescript
for (let i = 0; i < items.length; i++) {
	try {
		if (resource === 'portfolio') {
			if (operation === 'getAll') {
				responseData = await makeRequest.call(this, 'getOPQ', {}, authentication, authData);
			}
		} else if (resource === 'order') {
			if (operation === 'place') {
				const confirm = this.getNodeParameter('confirm', i, false) as boolean;
				const dryRun = this.getNodeParameter('dryRun', i, false) as boolean;
				// ... validation and payload building
				if (dryRun) {
					responseData = { dryRun: true, command: 'putOrderV2', params: orderParams };
				} else if (!confirm) {
					throw new NodeOperationError(this.getNode(), 'Confirm must be true', { itemIndex: i });
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
			}
		}
		// ... return data processing
	} catch (error) {
		if (this.continueOnFail()) {
			returnData.push({ json: { error: error.message } });
			continue;
		}
		throw error;
	}
}
```

## 7. Advanced UI Patterns

### Dynamic Tooling

The node is designed to be highly compatible with AI agents (e.g., using n8n's AI Agent node).

- **Property Descriptions**: Must be verbose and explain exactly what the input expects (e.g., "The ticker symbol including the market suffix like AAPL.US").
- **Dry Run Return**: When `dryRun` is enabled, always return a JSON object describing the action that _would_ have been taken. This helps agents "pre-flight" their decisions.

### Complex Data Inputs

For operations like `getAllSecurities` or `getCashflows`, use JSON string parameters for filters and sorting to provide full flexibility while keeping the UI clean.

```typescript
{
	displayName: 'Filters (JSON)',
	name: 'filtersJson',
	type: 'string',
	default: '[]',
	description: 'Filters array as JSON (e.g., [{"field":"ticker","operator":"eq","value":"AAPL.US"}])',
}
```

## 8. Deployment Checklist

Before finalizing any changes, ensure:

1. `npm run build` completes without errors.
2. `npm run lint` passes all n8n-specific rules.
3. Version in `package.json` is appropriately incremented if releasing.
4. Static files (SVG icons, JSON schemas) are correctly copied to `dist/`.
