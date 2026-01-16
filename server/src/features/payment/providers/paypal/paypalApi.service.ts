import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import {
	PAYPAL_API_BASE_URLS,
	PAYPAL_API_ENDPOINTS,
	PAYPAL_ORDER_STATUSES,
	PAYPAL_RETRY_CONFIG,
} from '@shared/constants';
import { isErrorWithCode, isErrorWithResponseStatus } from '@shared/utils';

import { AppConfig } from '@config';
import { serverLogger as logger } from '@internal/services';
import type {
	PayPalCaptureResponse,
	PayPalOrderResponse,
	PayPalWebhookVerificationRequest,
	PayPalWebhookVerificationResponse,
} from '@internal/types';
import { createServerError, extractPayPalError } from '@internal/utils';

import { PayPalAuthService } from './paypalAuth.service';

@Injectable()
export class PayPalApiService {
	constructor(
		private readonly httpService: HttpService,
		private readonly paypalAuthService: PayPalAuthService
	) {}

	async getOrderDetails(orderId: string): Promise<PayPalOrderResponse> {
		return this.executeWithRetry(
			async () => {
				const baseUrl = this.getBaseUrl();
				const accessToken = await this.paypalAuthService.getAccessToken();

				const response = await firstValueFrom(
					this.httpService.get<PayPalOrderResponse>(`${baseUrl}${PAYPAL_API_ENDPOINTS.ORDERS}/${orderId}`, {
						headers: {
							Authorization: `Bearer ${accessToken}`,
							'Content-Type': 'application/json',
						},
					})
				);

				return response.data;
			},
			orderId,
			'get PayPal order details'
		);
	}

	async captureOrder(orderId: string): Promise<PayPalCaptureResponse> {
		return this.executeWithRetry(
			async () => {
				const baseUrl = this.getBaseUrl();
				const accessToken = await this.paypalAuthService.getAccessToken();

				const response = await firstValueFrom(
					this.httpService.post<PayPalCaptureResponse>(
						`${baseUrl}${PAYPAL_API_ENDPOINTS.ORDERS}/${orderId}/capture`,
						{},
						{
							headers: {
								Authorization: `Bearer ${accessToken}`,
								'Content-Type': 'application/json',
							},
						}
					)
				);

				return response.data;
			},
			orderId,
			'capture PayPal order'
		);
	}

	async verifyWebhookSignature(
		verificationRequest: PayPalWebhookVerificationRequest
	): Promise<PayPalWebhookVerificationResponse> {
		return this.executeWithRetry(
			async () => {
				const baseUrl = this.getBaseUrl();
				const accessToken = await this.paypalAuthService.getAccessToken();

				const response = await firstValueFrom(
					this.httpService.post<PayPalWebhookVerificationResponse>(
						`${baseUrl}${PAYPAL_API_ENDPOINTS.WEBHOOK_VERIFY}`,
						verificationRequest,
						{
							headers: {
								Authorization: `Bearer ${accessToken}`,
								'Content-Type': 'application/json',
							},
						}
					)
				);

				return response.data;
			},
			verificationRequest.webhook_event.id ?? 'unknown',
			'verify PayPal webhook signature'
		);
	}

	validateOrderAmount(order: PayPalOrderResponse, expectedAmount: number, currency: string): boolean {
		if (!order.purchase_units || order.purchase_units.length === 0) {
			return false;
		}

		const purchaseUnit = order.purchase_units?.[0];
		if (!purchaseUnit?.amount) {
			return false;
		}

		const orderAmount = parseFloat(purchaseUnit.amount.value);
		const orderCurrency = purchaseUnit.amount.currency_code.toUpperCase();
		const expectedCurrency = currency.toUpperCase();

		if (orderCurrency !== expectedCurrency) {
			return false;
		}

		const tolerance = 0.01;
		return Math.abs(orderAmount - expectedAmount) < tolerance;
	}

	isOrderApproved(order: PayPalOrderResponse): boolean {
		return order.status === PAYPAL_ORDER_STATUSES.APPROVED || order.status === PAYPAL_ORDER_STATUSES.COMPLETED;
	}

	needsCapture(order: PayPalOrderResponse): boolean {
		return order.status === PAYPAL_ORDER_STATUSES.APPROVED;
	}

	private getBaseUrl(): string {
		const environment = AppConfig.paypal.environment;
		return environment === 'production' ? PAYPAL_API_BASE_URLS.PRODUCTION : PAYPAL_API_BASE_URLS.SANDBOX;
	}

	private async executeWithRetry<T>(operation: () => Promise<T>, orderId: string, operationName: string): Promise<T> {
		let lastError: unknown = null;

		for (let attempt = 0; attempt <= PAYPAL_RETRY_CONFIG.MAX_RETRIES; attempt++) {
			try {
				return await operation();
			} catch (error) {
				lastError = error;

				if (!this.isRetryableError(error) || attempt === PAYPAL_RETRY_CONFIG.MAX_RETRIES) {
					const errorMessage = extractPayPalError(error);
					logger.paymentFailed(orderId, `Failed to ${operationName}`, {
						errorInfo: { message: errorMessage },
						attempt: attempt + 1,
						maxRetries: PAYPAL_RETRY_CONFIG.MAX_RETRIES,
					});
					throw createServerError(operationName, new Error(errorMessage));
				}

				const delay = Math.min(
					PAYPAL_RETRY_CONFIG.INITIAL_DELAY_MS * Math.pow(PAYPAL_RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt),
					PAYPAL_RETRY_CONFIG.MAX_DELAY_MS
				);

				logger.apiUpdate('paypal_retry', {
					operation: operationName,
					orderId,
					attempt: attempt + 1,
					delay,
				});

				await this.sleep(delay);
			}
		}

		const errorMessage = extractPayPalError(lastError);
		throw createServerError(operationName, new Error(errorMessage));
	}

	private isRetryableError(error: unknown): boolean {
		if (isErrorWithResponseStatus(error)) {
			const status = error.response?.status;
			if (status && status >= 500 && status < 600) {
				return true;
			}
		}

		if (isErrorWithCode(error)) {
			const code = error.code;
			if (code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') {
				return true;
			}
		}

		return false;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}
