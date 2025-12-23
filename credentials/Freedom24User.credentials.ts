import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class Freedom24User implements ICredentialType {
	name = 'freedom24User';
	displayName = 'Freedom24 User Login';
	documentationUrl = 'https://tradernet.com/api';
	properties: INodeProperties[] = [
		{
			displayName: 'Email / Login',
			name: 'login',
			type: 'string',
			default: '',
			required: true,
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
		},
	];
}
