import { Body, Controller, Headers, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { API_ENDPOINTS } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { AppConfig } from '@config';
import { serverLogger as logger } from '@internal/services';
import type { PayPalWebhookEvent, PayPalWebhookVerificationRequest } from '@internal/types';

import { PayPalApiService } from './paypalApi.service';
import { PayPalWebhookService } from './paypalWebhook.service';

@Controller(API_ENDPOINTS.PAYMENT.BASE)
export class PayPalWebhookController {
	constructor(
		private readonly paypalApiService: PayPalApiService,
		private readonly paypalWebhookService: PayPalWebhookService
	) {}

	@Post('webhooks/paypal')
	@HttpCode(HttpStatus.OK)
	async handleWebhook(
		@Body() event: PayPalWebhookEvent,
		@Headers('paypal-transmission-id') transmissionId: string | undefined,
		@Headers('paypal-transmission-sig') transmissionSig: string | undefined,
		@Headers('paypal-transmission-time') transmissionTime: string | undefined,
		@Headers('paypal-cert-url') certUrl: string | undefined,
		@Headers('paypal-auth-algo') authAlgo: string | undefined
	) {
		try {
			if (!transmissionId || !transmissionSig || !transmissionTime || !certUrl || !authAlgo) {
				logger.paymentFailed(event.id ?? 'unknown', 'Missing webhook signature headers', {
					hasTransmissionId: !!transmissionId,
					hasTransmissionSig: !!transmissionSig,
					hasTransmissionTime: !!transmissionTime,
					hasCertUrl: !!certUrl,
					hasAuthAlgo: !!authAlgo,
				});
				return { status: 'error', message: 'Missing required webhook headers' };
			}

			const webhookId = process.env.PAYPAL_WEBHOOK_ID ?? AppConfig.paypal.merchantId;
			if (!webhookId) {
				logger.paymentFailed(event.id ?? 'unknown', 'PayPal webhook ID not configured', {});
				return { status: 'error', message: 'Webhook ID not configured' };
			}

			const verificationRequest: PayPalWebhookVerificationRequest = {
				auth_algo: authAlgo,
				cert_url: certUrl,
				transmission_id: transmissionId,
				transmission_sig: transmissionSig,
				transmission_time: transmissionTime,
				webhook_id: webhookId,
				webhook_event: event,
			};

			const verificationResult = await this.paypalApiService.verifyWebhookSignature(verificationRequest);

			if (verificationResult.verification_status !== 'SUCCESS') {
				logger.paymentFailed(event.id ?? 'unknown', 'Webhook signature verification failed', {
					verificationStatus: verificationResult.verification_status,
				});
				return {
					status: 'error',
					message: 'Webhook signature verification failed',
				};
			}

			await this.paypalWebhookService.handleWebhookEvent(event);

			return { status: 'success' };
		} catch (error) {
			const errorMessage = getErrorMessage(error);
			logger.paymentFailed(event.id ?? 'unknown', 'Webhook processing error', {
				errorInfo: { message: errorMessage },
			});

			return { status: 'error', message: errorMessage };
		}
	}
}
