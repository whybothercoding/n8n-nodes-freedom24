import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class Freedom24UserApi implements ICredentialType {
	name = 'freedom24UserApi';
	displayName = 'Freedom24 User Login API';
	documentationUrl = 'https://tradernet.com/api';
	icon = 'file:freedom24.svg' as const;
	test = {
		request: {
			baseURL: 'https://tradernet.com/api',
			url: '/getMarketStatus',
		},
	};
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
