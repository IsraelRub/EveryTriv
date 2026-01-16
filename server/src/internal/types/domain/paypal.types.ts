import { PayPalCaptureStatus, PayPalOrderStatus } from '@shared/constants';

export interface PayPalLinks {
	href: string;
	rel: string;
	method: string;
}

export interface PayPalAccessTokenResponse {
	access_token: string;
	token_type: string;
	expires_in: number;
	scope: string;
}

export interface PayPalAmount {
	currency_code: string;
	value: string;
}

export interface PayPalPurchaseUnit {
	reference_id: string;
	amount: PayPalAmount;
	payee?: {
		email_address?: string;
		merchant_id?: string;
	};
	description?: string;
	payments?: {
		captures?: Array<{
			id: string;
			status?: string;
			amount?: PayPalAmount;
		}>;
	};
}

export interface PayPalOrderResponse {
	id: string;
	intent: string;
	status: PayPalOrderStatus;
	purchase_units: PayPalPurchaseUnit[];
	create_time: string;
	update_time: string;
	links?: PayPalLinks[];
}

export interface PayPalCapture {
	id: string;
	status: PayPalCaptureStatus;
	amount: PayPalAmount;
	final_capture?: boolean;
	create_time: string;
	update_time: string;
}

export interface PayPalCaptureResponse {
	id: string;
	status: PayPalOrderStatus;
	purchase_units: Array<{
		reference_id: string;
		payments: {
			captures: PayPalCapture[];
		};
	}>;
	create_time: string;
	update_time: string;
	links?: PayPalLinks[];
}

export interface PayPalWebhookEvent {
	id: string;
	event_version: string;
	create_time: string;
	resource_type: string;
	resource_version?: string;
	event_type: string;
	summary: string;
	resource: {
		id?: string;
		status?: string;
		amount?: PayPalAmount;
		custom_id?: string;
		[s: string]: unknown;
	};
	links?: PayPalLinks[];
}

export interface PayPalWebhookVerificationRequest {
	auth_algo: string;
	cert_url: string;
	transmission_id: string;
	transmission_sig: string;
	transmission_time: string;
	webhook_id: string;
	webhook_event: PayPalWebhookEvent;
}

export interface PayPalWebhookVerificationResponse {
	verification_status: 'SUCCESS' | 'FAILURE';
}

export interface PayPalErrorResponse {
	name: string;
	message: string;
	debug_id: string;
	details?: Array<{
		field?: string;
		value?: string;
		issue: string;
		description?: string;
	}>;
	links?: PayPalLinks[];
}
