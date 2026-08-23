import { INode, NodeOperationError } from 'n8n-workflow';

/** Shared confirm/dryRun safety gate for every mutating operation. */
export function requireConfirmed(node: INode, i: number, confirm: boolean, actionLabel: string): void {
	if (!confirm) {
		throw new NodeOperationError(
			node,
			`Refusing to ${actionLabel} without confirm=true (use dryRun=true to preview the request).`,
			{ itemIndex: i },
		);
	}
}
