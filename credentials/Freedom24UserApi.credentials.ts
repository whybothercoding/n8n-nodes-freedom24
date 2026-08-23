import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class Freedom24UserApi implements ICredentialType {
	name = 'freedom24UserApi';
	displayName = 'Freedom24 User Login API';
	documentationUrl = 'https://tradernet.com/api';
	icon = 'file:freedom24.svg' as const;
	// Tested by the Freedom24 node's methods.credentialTest.freedom24UserApiCredentialTest — a
	// real login attempt, not the unauthenticated GET this used to declare (which passed for any
	// input, valid or not).
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
