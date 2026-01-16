import type { BasicUser, CreditBalance, PaymentResult } from '@shared/types';

export interface AuthResponse {
	accessToken?: string;
	refreshToken?: string;
	user?: BasicUser;
}

export interface AuthState {
	isAuthenticated: boolean;
	token: string | null;
}

export interface CreditsPurchaseResponse extends PaymentResult {
	balance?: CreditBalance;
}
