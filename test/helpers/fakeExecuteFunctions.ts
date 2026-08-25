import type {
	ICredentialDataDecryptedObject,
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
} from 'n8n-workflow';

export interface FakeHttpResponse {
	statusCode: number;
	body: unknown;
	headers?: Record<string, string | string[]>;
}

export interface FakeExecuteFunctionsOptions {
	/** Either one params object shared by every item, or one per item (indexed). */
	params: IDataObject | IDataObject[];
	credentials?: Record<string, ICredentialDataDecryptedObject>;
	items?: INodeExecutionData[];
	continueOnFail?: boolean;
	httpRequest?: (options: IHttpRequestOptions) => Promise<FakeHttpResponse> | FakeHttpResponse;
	timezone?: string;
}

export interface FakeExecuteFunctionsResult {
	ctx: IExecuteFunctions;
	httpCalls: IHttpRequestOptions[];
}

/**
 * A hand-rolled, minimal IExecuteFunctions. getNodeParameter is deliberately strict — it throws
 * for a parameter that isn't present in the fake's params bag and no fallback default was given
 * to getNodeParameter, mirroring how n8n only persists parameters that are actually displayed for
 * the current resource/operation. A lenient fake that silently returns undefined would hide this
 * exact class of bug (see history.getCashflows in the pre-refactor code).
 */
export function createFakeExecuteFunctions(
	options: FakeExecuteFunctionsOptions,
): FakeExecuteFunctionsResult {
	const items = options.items ?? [{ json: {} }];
	const httpCalls: IHttpRequestOptions[] = [];

	function paramsFor(i: number): IDataObject {
		return Array.isArray(options.params) ? (options.params[i] ?? {}) : options.params;
	}

	const ctx = {
		getInputData(): INodeExecutionData[] {
			return items;
		},
		getNodeParameter(name: string, i: number, fallback?: unknown): unknown {
			const bag = paramsFor(i);
			if (name in bag) return bag[name];
			if (arguments.length >= 3) return fallback;
			throw new Error(`Could not get parameter "${name}"`);
		},
		async getCredentials(type: string): Promise<ICredentialDataDecryptedObject> {
			const found = options.credentials?.[type];
			if (!found) throw new Error(`No credentials of type "${type}" registered in fake`);
			return found;
		},
		getNode() {
			return {
				id: '1',
				name: 'Freedom24',
				type: 'n8n-nodes-freedom24.freedom24',
				typeVersion: 1,
				position: [0, 0],
				parameters: {},
			};
		},
		continueOnFail(): boolean {
			return options.continueOnFail ?? false;
		},
		getTimezone(): string {
			return options.timezone ?? 'UTC';
		},
		helpers: {
			async httpRequest(requestOptions: IHttpRequestOptions): Promise<FakeHttpResponse> {
				httpCalls.push(requestOptions);
				if (!options.httpRequest) {
					throw new Error('Fake httpRequest called but no httpRequest handler was provided');
				}
				return options.httpRequest(requestOptions);
			},
			returnJsonArray(json: IDataObject | IDataObject[]): INodeExecutionData[] {
				const arr = Array.isArray(json) ? json : [json];
				return arr.map((item) => ({ json: item }));
			},
			constructExecutionMetaData(
				data: INodeExecutionData[],
				meta: { itemData: { item: number } | { item: number }[] },
			): INodeExecutionData[] {
				return data.map((item) => ({ ...item, pairedItem: meta.itemData }));
			},
		},
	};

	return { ctx: ctx as unknown as IExecuteFunctions, httpCalls };
}
