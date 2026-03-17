import type { PayPalEnvironment } from '@shared/constants';

export interface PayPalConfig {
	clientId: string;
	clientSecret: string;
	merchantId: string;
	environment: PayPalEnvironment;
}
