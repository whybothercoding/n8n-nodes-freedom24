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

**Node type string when building/deploying a workflow programmatically (e.g. via n8n-mcp) against a `~/.n8n/custom`-installed instance:** it is `CUSTOM.freedom24`, **not** the npm package's node type. Verified 2026-08-25 by reading n8n's own loader source on the live instance (`n8n-core`'s `CustomDirectoryLoader` hardcodes `packageName = CUSTOM_NODES_PACKAGE_NAME` — the literal string `"CUSTOM"` — for every node loaded from the custom folder, regardless of its `package.json` name or on-disk subfolder name; the fully-qualified type registered globally is `` `${packageName}.${node.description.name}` ``, i.e. `CUSTOM.freedom24`). Using the npm package's own type string fails workflow activation with `Unrecognized node type`, even though the package itself is loaded correctly (icon serves fine, no boot errors) — this is a distinct failure mode from a broken install, easy to misdiagnose as one. This is a property of the custom-folder loader itself, not specific to this node — applies to any node installed the same way on this instance (e.g. `n8n-nodes-beehiiv` too, despite its on-disk folder happening to match its package name).

**Package renamed to `@indiegoweb/n8n-nodes-freedom24` (2026-08-25):** the published npm package moved from the unscoped `n8n-nodes-freedom24` (0.2.0/0.2.1, still live) to the scoped `@indiegoweb/n8n-nodes-freedom24` (0.2.2+), matching `@indiegoweb/n8n-nodes-beehiiv`'s naming. npm has no package rename — this is a new, separate package identity, so the old unscoped package gets `npm deprecate`d pointing at the new one rather than updated in place. The node's type string when installed via n8n's Community Nodes UI/API (not the custom-folder dev path above) changes accordingly, from `n8n-nodes-freedom24.freedom24` to `@indiegoweb/n8n-nodes-freedom24.freedom24`; any instance with the old unscoped package installed that way needs to uninstall it and install the new scoped one — this is a breaking change for that install path, not a cosmetic rename. **First publish of the new scoped package can't go through the existing OIDC trusted-publishing workflow** — npm requires a package to already exist before a trusted publisher can be configured for it on npmjs.com, so v0.2.2 needs one manual `npm publish --access public` (authenticated npm login + 2FA) before `git tag v0.2.2 && git push origin v0.2.2` will work through CI; only subsequent releases can use the tag-push workflow. Same bootstrap constraint `n8n-nodes-beehiiv`'s `install_node.sh` header documents for its own scoped rename.

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

- Prefer a pure helper that throws a domain error (`PayloadValidationError` in `helpers/payloads.ts`) over reaching for `NodeOperationError` inside a pure function that has no way to get one — `actions/router.ts` is the one place `PayloadValidationError` gets translated into a real `NodeOperationError` with `itemIndex` attached. `helpers/parse.ts`'s `parseJsonParam`/`parseJsonArrayParam` are the one exception: they take `(node: INode, itemIndex: number, ...)` and throw `NodeOperationError` directly, because the portal's stricter linter (below) flags a domain-error class thrown from inside a `catch` block (unavoidable there — parsing JSON can only signal failure by throwing) even when it's just meant for translation by a caller. Taking a plain `INode` doesn't cost the function its purity/testability — it's a data object, not `IExecuteFunctions` — only a full execution-context dependency would.
- Where an action does need to throw directly (a confirm-gate, an unmatched operation), use `NodeOperationError` and **always** provide `{ itemIndex: i }`.
- Use `NodeApiError` for low-level HTTP failures and API-level rejections (`transport/request.ts`'s `makeRequest` is the only place that constructs these directly from a raw HTTP failure). Every catch-all fallback elsewhere (`Freedom24.node.ts`'s two outer catches, `actions/router.ts`'s non-`PayloadValidationError` branch) also rewraps via `new NodeApiError(this.getNode(), error as JsonObject, ...)` rather than a bare `throw error` — never rely on plain rethrow in a catch block that might be the last stop before the error reaches the n8n UI. `NodeApiError`'s constructor returns an already-`NodeApiError` argument unchanged (`if (errorResponse instanceof NodeApiError) return errorResponse;`), so this is a lossless no-op for the common case (an untranslated `NodeApiError` from `makeRequest` passing through) and a message/description-preserving rewrap for anything else (e.g. an already-thrown `NodeOperationError`).
- **n8n Creator Portal review uses a stricter linter than `npm run lint`.** `npx @n8n/scan-community-package@beta <pkg>` runs `@n8n/eslint-plugin-community-nodes`'s `recommended` config (verified 2026-08-25 by reading `scan-community-package`'s own source), which this repo's local `n8n-node lint` does not include at all — passing local lint is not evidence the portal scan will pass. Its `require-node-api-error` rule flags *any* `throw` inside a `catch` block whose argument isn't a fresh `new NodeApiError(...)`/`new NodeOperationError(...)` call — including a bare rethrow of the caught error, which is otherwise idiomatic. The scanner also runs with `allowInlineConfig: false`, so `// eslint-disable-next-line` (the normal escape hatch, still valid for local lint and genuinely-no-alternative cases) is silently ignored for the portal check — there is no way to suppress a portal-scan finding without actually changing the code. To check locally before publishing, `import { analyzePackage } from '@n8n/scan-community-package/scanner/scanner.mjs'` and call it against the working tree directly (it accepts a local directory, not just a published package name).
- **Credential testing splits by credential type — re-verified against current n8n source 2026-09-01, not just the live API:** `Freedom24Api` (API Key) uses a declarative `test:` + function-based `authenticate` on `Freedom24Api.credentials.ts` (reusing `signPayload`/`buildApiKeyHeaders` unchanged) — a bad public key or bad signature both come back as a real HTTP 403 with `{"error": "..."}`, not Tradernet's usual 200-with-error-body shape, so the default non-2xx check is a genuine test. `Freedom24UserApi` (User Login) stays on the custom `methods.credentialTest.freedom24UserApiCredentialTest` (`testedBy`): a deliberately wrong login/password still comes back HTTP 200 with `{"error": "Incorrect email or password"}` (message varies by failure reason), and Tradernet issues a session cookie either way — so status code and cookie presence are both useless, and only body inspection catches it. The n8n Creator Portal reviewer pushed back on this 2026-09-01, asking whether the declarative approach could work instead — confirmed it genuinely can't, by cloning `n8n-io/n8n` and reading the current rule engine directly (not the npm `latest` dist-tag, which turned out to be ~5 months stale versus actual publishing — checked `stable` 2.36.7 and newest `beta` 2.38.0 too, same result across all of them). The rule type is `ICredentialTestRequest.rules: IAuthenticateRuleResponseCode[] | IAuthenticateRuleResponseSuccessBody[]` (not `ICredentialTestRequestRule` — that name doesn't exist in current source), evaluated in `packages/cli/src/services/credentials-tester.service.ts`: `responseCode` only fires inside the catch branch after a thrown non-2xx, which Tradernet's login endpoint never produces (always 200); `responseSuccessBody` only supports one fixed `lodash.get(body, key) === value` pair via strict equality — no presence-check, no negation, no wildcard — so a *varying* error message can't be matched (one rule per exact known string doesn't cover a message that changes per failure reason). `ICredentialTestFunctions.helpers` for `testedBy` functions is still just `SSHTunnelFunctions & { request }` — no `httpRequest` alternative — confirmed against the same current source, not just `n8n-core@2.16.1`. Corroborating evidence: current n8n master has a new `probeCredentialAuth`/`resolveAuthProbeVerdict` mechanism (`credentials-tester.service.ts` L255-403) built for exactly this "2xx regardless of credential" ambiguity — but it's driven by a `testUrl` field on the built-in "Templated Custom Auth" credential type's own stored data, isn't reachable from a community credential's own `test`/`testedBy`, and its own doc comment explicitly says it *hedges* (returns `status: 'OK'` with caveated copy) rather than resolving the ambiguity — n8n's own newest verification code punts on the same problem this repo hit. There is no non-deprecated way to make an HTTP call from inside a `testedBy` credential-test function, and switching this one credential to declarative would regress to the "always passes" bug 0.2.0 fixed by adding real `testedBy` functions in the first place. Left as-is with a justifying inline comment; this is a confirmed, current platform gap, not something to code around — the reply sent to the portal reviewer cited this evidence directly.

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

## 8. Open todos

- [ ] **`dist/package.json` is stale at 0.2.3 while source `package.json` is
  0.2.4.** Since `files: ["dist"]` ships that whole directory, a publish
  without a fresh build ships a `dist/package.json` whose version disagrees
  with the published one. Fix with a clean rebuild (`rm -rf dist .tsbuildinfo
  && npm run build` — see §7's incremental-cache warning) before the next
  release. Found 2026-09-06, deliberately left untouched as out of scope then.
- [ ] **Workflow changes are committed but have never actually run.**
  `.github/workflows/publish.yml` (2026-09-06): `npm install -g npm@latest` →
  `npm@12.0.2` plus a `npm config set strict-allow-scripts true` step before
  `npm ci`. `.github/workflows/ci.yml` (2026-09-06): matrix `[20.x, 22.x]` →
  `[22.x, 24.x]` (Node 20 hit upstream EOL 30 Apr 2026; 24 matches what
  `publish.yml` already runs and n8n's own supported ceiling), and
  `actions/setup-node@v4` → `@v6` to match `publish.yml`. Neither has been
  exercised by a real Actions run — push a branch and watch it, and **do not
  validate by cutting a real release**.
- [ ] **Don't tighten `engines.node`.** It is deliberately `>=20.0.0`, a
  permissive floor, not an oversight. This package's real runtime is whatever
  Node major the live self-hosted `n8nio/n8n` Docker image bundles — not
  something this repo controls or can verify. n8n supports Node 20.19–24.x and
  explicitly **not** 25 (odd/Current releases break `isolated-vm`'s native
  ABI). Pinning this to `24.x` would assert a guarantee the package can't
  keep. Recorded as a tracked variant in
  `indiegoweb-global/systems/npm-dependency-policy/variants.yaml`.
