# Agent Instructions for n8n-nodes-freedom24

This repository contains a native n8n community node for the Freedom24 (Tradernet) Trading API. It was migrated from an MCP server and is designed to work both as a workflow node and an AI agent tool.

## 1. Commands

### Build and Lint

- **Build**: `npm run build` (Compiles TS and copies static files to `dist/`)
- **Lint**: `npm run lint` (Checks for style and n8n-specific rules)
- **Fix Lint**: `npm run lint:fix` (Automatically fixes most issues)
- **Watch**: `npm run build:watch` (Automatic recompilation on changes)

### Testing

- **Unit tests**: `npm test` (Vitest, offline — pure payload/response/auth logic, no live API calls)
- **Watch mode**: `npm run test:watch`
- **Coverage**: `npm run test:coverage`
- **Type check only**: `npm run typecheck` (uses `tsconfig.test.json`, which also covers `test/` — the plain root `tsconfig.json` only covers `nodes/`+`credentials/` and is what `npm run build` uses)

Live-instance verification is still required for anything a unit test can't reach (real HTTP round-trips, n8n's own parameter-visibility engine):

1. Building the project (`npm run build`).
2. Deploying to a test n8n instance (copying `dist/` and `package.json`).
3. Running a manual trigger workflow.

**Node type string when building/deploying a workflow programmatically (e.g. via n8n-mcp) against a `~/.n8n/custom`-installed instance:** it is `CUSTOM.freedom24`, **not** `n8n-nodes-freedom24.freedom24`. Verified 2026-08-25 by reading n8n's own loader source on the live instance (`n8n-core`'s `CustomDirectoryLoader` hardcodes `packageName = CUSTOM_NODES_PACKAGE_NAME` — the literal string `"CUSTOM"` — for every node loaded from the custom folder, regardless of its `package.json` name or on-disk subfolder name; the fully-qualified type registered globally is `` `${packageName}.${node.description.name}` ``, i.e. `CUSTOM.freedom24`). Using the npm-style `n8n-nodes-freedom24.freedom24` type fails workflow activation with `Unrecognized node type`, even though the package itself is loaded correctly (icon serves fine, no boot errors) — this is a distinct failure mode from a broken install, easy to misdiagnose as one. This is a property of the custom-folder loader itself, not specific to this node — applies to any node installed the same way on this instance (e.g. `n8n-nodes-beehiiv` too, despite its on-disk folder happening to match its package name).

## 2. Project Structure

- `nodes/Freedom24/Freedom24.node.ts`: Node description assembly, `execute()` loop (auth setup, pairedItem, continueOnFail), `methods` (credentialTest/listSearch).
- `nodes/Freedom24/descriptions/`: Per-resource property definitions. Each resource owns its own copies of shared-name fields (Ticker, Confirm, Dry Run) scoped to exactly the operations that use them — don't reintroduce one shared field with a show/hide matrix spanning multiple resources; that's what caused the original displayOptions leakage bugs.
- `nodes/Freedom24/actions/`: One handler per resource (`execute(this, i, operation, auth)`), plus `router.ts` — the single dispatch point, and the only place a pure helper's `PayloadValidationError`/`JsonParamParseError` gets translated into `NodeOperationError` with `itemIndex`.
- `nodes/Freedom24/transport/`: `signing.ts` (pure HMAC), `request.ts` (endpoint resolution/fallback, `makeRequest`), `session.ts` (User Login).
- `nodes/Freedom24/helpers/`: Pure payload builders (`payloads.ts`), response unwrapping/error detection (`responses.ts`), guarded JSON parsing (`parse.ts`), the ticker resourceLocator adapter (`ticker.ts`), the confirm/dryRun guard (`guard.ts`), the `dynamic.call` mutation heuristic (`mutation.ts`) — none of these touch `IExecuteFunctions`, which is what makes them directly unit-testable.
- `nodes/Freedom24/methods/`: Real `credentialTest` probes and Ticker's `listSearch`.
- `nodes/Freedom24/types/`: Shared Tradernet API types.
- `credentials/Freedom24Api.credentials.ts`: API Key authentication definition (no declarative `test` — tested via `methods.credentialTest.freedom24ApiCredentialTest`, referenced by `testedBy` on the node's credentials array).
- `credentials/Freedom24UserApi.credentials.ts`: User Login (session-based) authentication definition (same pattern, `freedom24UserApiCredentialTest`).
- `icons/`: SVG icons for the node.
- `test/`: Vitest specs, mirroring the `nodes/Freedom24/` layout.

There is no `freedom-mcp-server/` reference checkout in this repo — it previously existed as a git-tracked symlink to a path on the author's machine, which broke on every other clone and leaked a local filesystem path on a public repo. It was removed; the MCP server it pointed to is a separate, unrelated project.

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

- Prefer a pure helper that throws a domain error (`PayloadValidationError` in `helpers/payloads.ts`, `JsonParamParseError` in `helpers/parse.ts`) over reaching for `NodeOperationError` inside a pure function — pure functions don't have `this.getNode()`. `actions/router.ts` is the one place these get translated into a real `NodeOperationError` with `itemIndex` attached.
- Where an action does need to throw directly (a confirm-gate, an unmatched operation), use `NodeOperationError` and **always** provide `{ itemIndex: i }`.
- Use `NodeApiError` for low-level HTTP failures and API-level rejections (`transport/request.ts`'s `makeRequest` is the only place that constructs these).

### Resource/Operation Pattern

The node follows the standard n8n Resource -> Operation pattern.

- Every field should have `displayOptions` to only show up when the correct resource and operation are selected.
- Use `noDataExpression: true` for Resource and Operation options.

## 4. Trading & AI Agent Readiness

### Mutation Safety

All operations that modify state (Place Order, Cancel, Create Watchlist, etc.) **must** include:

- `confirm`: A boolean toggle to prevent accidental execution.
- `dryRun`: A boolean toggle that returns the request payload without sending it to the API.

Use `helpers/guard.ts`'s `requireConfirmed()` rather than hand-rolling the check.

`dynamic.call` can't rely on a fixed operation list — the command is arbitrary user input — so it uses `helpers/mutation.ts`'s `looksLikeMutatingCommand()`, a conservative prefix-based heuristic (`put`, `delete`/`del`, `add`, `update`, `toggle`, `make`, `cancel`, `remove`, `create`, `set`, `save`, `edit`). If you add a new mutating Tradernet command name that doesn't start with one of these, add its prefix to the list — the heuristic must stay biased toward over-blocking (annoying but safe) rather than under-blocking (a real mutation slipping through unconfirmed).

### AI Tooling

- The node has `usableAsTool: true`.
- Descriptions for properties should be descriptive enough for an LLM to understand their purpose.
- Tickers should consistently mention the format (e.g., `AAPL.US`).

## 5. API Implementation Notes

- HMAC signing for API Key auth lives in `transport/signing.ts` (pure — `signPayload`/`buildApiKeyHeaders`) and is exercised by `transport/request.ts`.
- Session-based auth (User Login) involves `transport/session.ts`'s `getSessionId()` — a separate login call (**form-urlencoded**, not JSON — Tradernet's documented contract) and a `SID` cookie extraction. Accounts requiring SMS/2FA confirmation on login are not supported; `getSessionId` throws a message saying so rather than hanging or silently failing.
- Every request goes through `transport/request.ts`'s `makeRequest(this, command, params, auth, strategy)`. `strategy` is mandatory, not defaulted, so every call site states its intent explicitly:
  - `'fixedV2'` — the two proven trading mutations (`putOrderV2`, `putStopLoss`). No fallback, ever.
  - `'fixedV1'` — every other built-in mutating command (`deleteOrder`, `addStockList`, `updateStockList`, `deleteStockList`, `makeStockListSelected`, `addStockListTicker`, `deleteStockListTicker`, `togglePriceAlert`). No fallback.
  - `'auto'` — every read-only command, and `dynamic.call` regardless of what it turns out to be. Falls back v2 → v1 → v1-wrapped-query, but **only** on an unambiguous 404 or `{error: "Command not found"}` — never on a 5xx/timeout, because a mutating command may have already executed server-side and a fallback retry there could resubmit it.
- **Tradernet returns HTTP 200 with `{error}`/`{errMsg}` bodies on failure.** `makeRequest` checks the body for this on every response, in addition to the HTTP status — don't add a new call path that skips this check.
- **No retry-with-delay.** n8n community nodes run sandboxed for cloud compatibility, and `setTimeout`/`setInterval` are banned globals there (`@n8n/community-nodes/no-restricted-globals`). There's no way to implement a real backoff delay inside `execute()`. Don't reach for one — a same-tick retry on 429 just hits the rate limit again, so failures surface immediately instead of faking a backoff that isn't one.
- **`eslint.config.mjs` must stay byte-identical to the `@n8n/node-cli` default template.** `package.json`'s `n8n.strict: true` enforces this at lint time (`n8n-node lint` diffs it against the shipped template and hard-fails on any difference). If a file genuinely needs an exemption from a rule (test files needing `vitest`/`no-restricted-imports`, `ICredentialTestFunctions.helpers.request` being deprecated with no alternative in that context), use an inline `// eslint-disable-next-line <rule>` comment with a one-line reason, not a config change.

## 6. Adding a New Operation

1. Add the property definitions to the relevant `descriptions/<Resource>.description.ts` — scoped to that resource+operation only (see §2 on shared-name fields).
2. If the operation mutates state, add it to that resource's `buildConfirmAndDryRun(...)` operation list.
3. If payload construction is non-trivial, add a pure builder to `helpers/payloads.ts` (parameters in, `IDataObject` out, no `IExecuteFunctions`) and a test in `test/helpers/payloads.test.ts`.
4. Add the branch to the resource's `actions/<resource>.ts` `execute()` — read parameters, call the builder, gate on confirm/dryRun via `requireConfirmed()` if mutating, call `makeRequest` with an explicit `strategy`.
5. `npm run build && npm run lint && npm test` before considering it done.

## 7. Deployment Checklist

Before finalizing any changes, ensure:

1. `npm run build` completes without errors. **Run `rm -rf dist .tsbuildinfo` first** if `dist/` already exists from a prior build — TypeScript's incremental cache (`.tsbuildinfo/build.tsbuildinfo`) can think nothing changed and silently emit zero `.js` files (only the static SVG/JSON assets get copied) even though `n8n-node build` still reports "✓ Build successful". Always verify with `find dist -name "*.js" | wc -l` before deploying `dist/` anywhere.
2. `npm run lint` passes all n8n-specific rules.
3. `npm test` passes.
4. Version in `package.json` is appropriately incremented if releasing.
5. Static files (SVG icons, JSON schemas) are correctly copied to `dist/`.
