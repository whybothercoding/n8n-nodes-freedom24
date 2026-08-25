import { INode, NodeOperationError } from 'n8n-workflow';

/**
 * Parses a JSON-string node parameter (filtersJson, sortJson, parametersJson, ...) and raises a
 * clear NodeOperationError instead of letting a bare SyntaxError escape. `node`/`itemIndex` are
 * threaded through by the caller (see actions/*.ts) rather than held here, which is what lets
 * this stay a pure, directly-testable function — it only needs a plain INode object, not a full
 * IExecuteFunctions.
 *
 * The JSON.parse failure is caught and stashed rather than thrown from inside the catch block —
 * n8n's community-node lint (`@n8n/community-nodes/require-node-api-error`) flags any throw of a
 * non-NodeApiError/NodeOperationError value from within a catch clause, even a domain-specific one
 * meant to be translated by a caller. Throwing the real NodeOperationError after the try/catch
 * block ends (rather than inside it) satisfies that both structurally and in spirit — the error
 * that actually escapes this function is always already the right type.
 */
export function parseJsonParam<T = unknown>(node: INode, itemIndex: number, paramName: string, raw: string): T {
	let parseErrorMessage: string | undefined;
	try {
		return JSON.parse(raw) as T;
	} catch (error) {
		const causeMessage = error instanceof Error ? error.message : String(error);
		parseErrorMessage = `Could not parse "${paramName}" as JSON: ${causeMessage}`;
	}
	throw new NodeOperationError(node, parseErrorMessage, { itemIndex });
}

/**
 * Same as parseJsonParam, but also verifies the parsed value is actually an array — valid JSON
 * like `{"field":"x"}` would otherwise pass parseJsonParam<unknown[]>'s type cast unchecked, then
 * silently vanish downstream (`.length` on a non-array is undefined, so a `.length > 0` gate on it
 * is always false) instead of surfacing as the parameter error it actually is.
 */
export function parseJsonArrayParam(
	node: INode,
	itemIndex: number,
	paramName: string,
	raw: string,
): unknown[] {
	const parsed = parseJsonParam<unknown>(node, itemIndex, paramName, raw);
	if (!Array.isArray(parsed)) {
		throw new NodeOperationError(
			node,
			`Could not parse "${paramName}" as JSON: expected a JSON array, got ${typeof parsed}`,
			{ itemIndex },
		);
	}
	return parsed;
}
