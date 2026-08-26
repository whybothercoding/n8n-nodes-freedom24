import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
	NodeApiError,
	NodeConnectionTypes,
} from 'n8n-workflow';

import { freedom24Properties } from './descriptions';
import { methods } from './methods';
import { router } from './actions/router';
import { AuthContext } from './transport/request';
import { getSessionId } from './transport/session';

export class Freedom24 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Freedom24',
		name: 'freedom24',
		icon: 'file:freedom24.svg',
		group: ['transform'],
		version: 1,
		description: 'Interact with Freedom24 / Tradernet API',
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		defaults: {
			name: 'Freedom24',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'freedom24Api',
				required: true,
				displayOptions: {
					show: { authentication: ['apiKey'] },
				},
			},
			{
				name: 'freedom24UserApi',
				required: true,
				testedBy: 'freedom24UserApiCredentialTest',
				displayOptions: {
					show: { authentication: ['userLogin'] },
				},
			},
		],
		properties: freedom24Properties,
	};

	methods = methods;

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const authentication = this.getNodeParameter('authentication', 0) as string;

		let auth: AuthContext;
		try {
			if (authentication === 'apiKey') {
				const credentials = await this.getCredentials('freedom24Api');
				auth = {
					type: 'apiKey',
					publicKey: credentials.publicKey as string,
					privateKey: credentials.privateKey as string,
				};
			} else {
				const credentials = await this.getCredentials('freedom24UserApi');
				const sid = await getSessionId.call(
					this,
					credentials.login as string,
					credentials.password as string,
				);
				auth = { type: 'userLogin', sid };
			}
		} catch (error) {
			// Auth happens once, outside the per-item loop below, so it needs its own
			// continueOnFail handling — otherwise a login failure kills the whole execution even
			// with "Continue On Fail" enabled, and every input item silently vanishes.
			if (this.continueOnFail()) {
				const message = (error as Error).message;
				return [items.map((_item, i) => ({ json: { error: message }, pairedItem: { item: i } }))];
			}
			throw new NodeApiError(this.getNode(), error as JsonObject);
		}

		for (let i = 0; i < items.length; i++) {
			try {
				const responseData = await router.call(this, i, auth);
				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
