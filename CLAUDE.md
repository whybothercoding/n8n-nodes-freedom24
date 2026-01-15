# Freedom24 n8n Node - Development Guidelines

## Commands

- **Build**: `npm run build` (Transpiles TS and copies static assets)
- **Lint**: `npm run lint` (Checks style and n8n rules)
- **Fix Lint**: `npm run lint:fix`
- **Watch**: `npm run build:watch`

## Code Style

- **Indentation**: Use **Tabs** (Mandatory for n8n community nodes).
- **Quotes**: Use **Single Quotes** for strings.
- **Naming**:
  - `PascalCase` for classes and types.
  - `camelCase` for variables, methods, and file names (except classes).
  - `Title Case` for UI labels in `displayName`.
- **Types**: Always use explicit types. Prefer `IDataObject` for API payloads and `JsonObject` for error contexts.
- **Imports**: `n8n-workflow` first, then built-in modules, then local files.

## Node Patterns

- **Resource -> Operation**: Use the standard n8n pattern with `displayOptions`.
- **Mutation Safety**: All state-changing operations (Place, Delete, Add, Update) MUST include:
  - `confirm`: Boolean toggle to execute.
  - `dryRun`: Boolean toggle to return the payload without executing.
- **Error Handling**:
  - Wrap `execute` loop in try-catch.
  - Use `NodeOperationError(this.getNode(), message, { itemIndex: i })`.
  - Use `NodeApiError` for low-level HTTP failures.
- **API Requests**: Use the internal `makeRequest` helper which handles HMAC signing and session management.

## Project Structure

- `nodes/Freedom24/Freedom24.node.ts`: Core node logic and UI definitions.
- `credentials/`: Authentication definitions for API Key and User Login.
- `icons/`: SVG icon for the node.
- `freedom-mcp-server/`: Reference implementation for API logic.

## Code Style

- **Indentation**: Tabs
- **Quotes**: Single quotes
- **Naming**: `PascalCase` for classes/types, `camelCase` for variables/functions.
- **n8n Workflow Types**: Always use `IDataObject`, `INodeProperties`, `INodeExecutionData`.
- **Error Handling**: Use `NodeOperationError(this.getNode(), msg, { itemIndex: i })` for user errors.

## Project Structure

- `nodes/Freedom24/Freedom24.node.ts`: Main logic and UI.
- `credentials/*.credentials.ts`: Authentication definitions.
- `icons/`: SVG node icon.

## Operational Patterns

- **Mutation Safety**: Include `confirm` and `dryRun` for all actions that change account state.
- **AI Readiness**: Use `usableAsTool: true` and descriptive help text for properties.
- **Resource/Operation**: Strictly follow n8n resource-based UI structure.
