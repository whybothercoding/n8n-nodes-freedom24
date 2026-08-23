import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';

import { AuthContext, makeRequest } from '../transport/request';
import { parseJsonParam } from '../helpers/parse';
import { looksLikeMutatingCommand } from '../helpers/mutation';

export async function execute(
	this: IExecuteFunctions,
	i: number,
	operation: string,
	auth: AuthContext,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'call') {
		const command = this.getNodeParameter('command', i) as string;
		const params = parseJsonParam<IDataObject>(
			'parametersJson',
			this.getNodeParameter('parametersJson', i, '{}') as string,
		);

		const dryRun = this.getNodeParameter('dryRun', i, false) as boolean;
		if (dryRun) return { dryRun: true, command, params };

		if (looksLikeMutatingCommand(command)) {
			const confirm = this.getNodeParameter('confirm', i, false) as boolean;
			if (!confirm) {
				throw new NodeOperationError(
					this.getNode(),
					`"${command}" looks like it mutates account state. Set confirm=true to run it ` +
						'(or dryRun=true to preview the request).',
					{ itemIndex: i },
				);
			}
		}

		return makeRequest.call(this, command, params, auth, 'auto');
	}

	throw new NodeOperationError(this.getNode(), `Unknown Dynamic operation "${operation}"`, {
		itemIndex: i,
	});
}
