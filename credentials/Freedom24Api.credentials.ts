import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class Freedom24Api implements ICredentialType {
	name = 'freedom24Api';
	displayName = 'Freedom24 API';
	documentationUrl = 'https://tradernet.com/api';
	properties: INodeProperties[] = [
		{
			displayName: 'Public Key',
			name: 'publicKey',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
		},
	];
}
