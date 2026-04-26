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

export interface PayPalPurchaseUnitCapture {
	id: string;
	status?: PayPalCaptureStatus;
	amount?: PayPalAmount;
}

export interface PayPalPurchaseUnitPayee {
	email_address?: string;
	merchant_id?: string;
}

export interface PayPalPurchaseUnitPayments {
	captures?: PayPalPurchaseUnitCapture[];
}

export interface PayPalPurchaseUnit {
	reference_id: string;
	amount: PayPalAmount;
	payee?: PayPalPurchaseUnitPayee;
	description?: string;
	payments?: PayPalPurchaseUnitPayments;
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

export interface PayPalCaptureResponsePurchaseUnit {
	reference_id: string;
	payments: {
		captures: PayPalCapture[];
	};
}

export interface PayPalCaptureResponse {
	id: string;
	status: PayPalOrderStatus;
	purchase_units: PayPalCaptureResponsePurchaseUnit[];
	create_time: string;
	update_time: string;
	links?: PayPalLinks[];
}

export interface PayPalWebhookEventResource {
	id?: string;
	status?: string;
	amount?: PayPalAmount;
	custom_id?: string;
	[s: string]: unknown;
}

export interface PayPalWebhookEvent {
	id: string;
	event_version: string;
	create_time: string;
	resource_type: string;
	resource_version?: string;
	event_type: string;
	summary: string;
	resource: PayPalWebhookEventResource;
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

export interface PayPalErrorDetail {
	field?: string;
	value?: string;
	issue: string;
	description?: string;
}

export interface PayPalErrorResponse {
	name: string;
	message: string;
	debug_id: string;
	details?: PayPalErrorDetail[];
	links?: PayPalLinks[];
}
