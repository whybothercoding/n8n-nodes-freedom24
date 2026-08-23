import { freedom24ApiCredentialTest, freedom24UserApiCredentialTest } from './credentialTest';
import { searchTickers } from './listSearch';

export const methods = {
	credentialTest: {
		freedom24ApiCredentialTest,
		freedom24UserApiCredentialTest,
	},
	listSearch: {
		searchTickers,
	},
};
