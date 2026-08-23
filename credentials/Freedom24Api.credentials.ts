import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class Freedom24Api implements ICredentialType {
	name = 'freedom24Api';
	displayName = 'Freedom24 API';
	documentationUrl = 'https://tradernet.com/api';
	icon = 'file:freedom24.svg' as const;
	// Tested by the Freedom24 node's methods.credentialTest.freedom24ApiCredentialTest — a real
	// HMAC-signed probe, not the unauthenticated GET this used to declare (which passed for any
	// input, valid or not).
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
