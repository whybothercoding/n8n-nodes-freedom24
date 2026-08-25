/**
 * Parses a JSON-string node parameter (filtersJson, sortJson, parametersJson, ...) and raises a
 * clear, typed error instead of letting a bare SyntaxError escape. Kept free of any n8n
 * IExecuteFunctions dependency — the node context / itemIndex are threaded through by the caller
 * (see actions/*.ts), which is what lets this stay a pure, directly-testable function.
 */
export class JsonParamParseError extends Error {
	constructor(
		public readonly paramName: string,
		public readonly raw: string,
		cause: unknown,
	) {
		super(
			`Could not parse "${paramName}" as JSON: ${cause instanceof Error ? cause.message : String(cause)}`,
		);
		this.name = 'JsonParamParseError';
	}
}

export function parseJsonParam<T = unknown>(paramName: string, raw: string): T {
	try {
		return JSON.parse(raw) as T;
	} catch (error) {
		throw new JsonParamParseError(paramName, raw, error);
	}
}

/**
 * Same as parseJsonParam, but also verifies the parsed value is actually an array — valid JSON
 * like `{"field":"x"}` would otherwise pass parseJsonParam<unknown[]>'s type cast unchecked, then
 * silently vanish downstream (`.length` on a non-array is undefined, so a `.length > 0` gate on it
 * is always false) instead of surfacing as the parameter error it actually is.
 */
export function parseJsonArrayParam(paramName: string, raw: string): unknown[] {
	const parsed = parseJsonParam<unknown>(paramName, raw);
	if (!Array.isArray(parsed)) {
		throw new JsonParamParseError(
			paramName,
			raw,
			new Error(`expected a JSON array, got ${typeof parsed}`),
		);
	}
	return parsed;
}
