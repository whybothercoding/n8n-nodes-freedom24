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
