import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaymentStatus, PAYPAL_WEBHOOK_EVENTS, SERVER_CACHE_KEYS, TIME_PERIODS_MS } from '@shared/constants';
import { getErrorMessage } from '@shared/utils';

import { PaymentHistoryEntity } from '@internal/entities';
import { CacheService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import type { PayPalWebhookEvent } from '@internal/types';
import { createServerError } from '@internal/utils';

@Injectable()
export class PayPalWebhookService {
	constructor(
		@InjectRepository(PaymentHistoryEntity)
		private readonly paymentHistoryRepository: Repository<PaymentHistoryEntity>,
		private readonly cacheService: CacheService
	) {}

	async handleWebhookEvent(event: PayPalWebhookEvent): Promise<void> {
		const eventId = event.id;
		const eventType = event.event_type;

		try {
			if (await this.isEventProcessed(eventId)) {
				logger.apiUpdate('paypal_webhook', {
					eventId,
					eventType,
					status: 'duplicate',
				});
				return;
			}

			switch (eventType) {
				case PAYPAL_WEBHOOK_EVENTS.PAYMENT_CAPTURE_COMPLETED:
					await this.handleCaptureCompleted(event);
					break;
				case PAYPAL_WEBHOOK_EVENTS.PAYMENT_CAPTURE_DENIED:
					await this.handleCaptureDenied(event);
					break;
				case PAYPAL_WEBHOOK_EVENTS.PAYMENT_CAPTURE_REFUNDED:
					await this.handleCaptureRefunded(event);
					break;
				case PAYPAL_WEBHOOK_EVENTS.PAYMENT_CAPTURE_PENDING:
					await this.handleCapturePending(event);
					break;
				default:
					logger.apiUpdate('paypal_webhook', {
						eventId,
						eventType,
						status: 'unhandled',
					});
			}

			await this.markEventAsProcessed(eventId);
		} catch (error) {
			const errorMessage = getErrorMessage(error);
			logger.paymentFailed(eventId, 'Failed to process webhook event', {
				eventType,
				errorInfo: { message: errorMessage },
			});
			throw createServerError('process PayPal webhook event', error);
		}
	}

	private async handleCaptureCompleted(event: PayPalWebhookEvent): Promise<void> {
		const captureId = event.resource?.id;
		if (!captureId) {
			return;
		}

		const payment = await this.findPaymentByPayPalId(captureId);
		if (!payment) {
			logger.apiUpdate('paypal_webhook', {
				eventId: event.id,
				eventType: event.event_type,
				status: 'payment_not_found',
				captureId,
			});
			return;
		}

		if (payment.status === PaymentStatus.COMPLETED) {
			return;
		}

		payment.status = PaymentStatus.COMPLETED;
		payment.completedAt = new Date();
		payment.failedAt = undefined;
		payment.metadata = {
			...payment.metadata,
			paypalTransactionId: captureId,
			webhookEventId: event.id,
		};

		await this.paymentHistoryRepository.save(payment);
		await this.invalidatePaymentHistoryCache(payment.userId);

		logger.apiUpdate('paypal_webhook', {
			eventId: event.id,
			eventType: event.event_type,
			paymentId: payment.providerTransactionId,
			status: 'completed',
		});
	}

	private async handleCaptureDenied(event: PayPalWebhookEvent): Promise<void> {
		const captureId = event.resource?.id;
		if (!captureId) {
			return;
		}

		const payment = await this.findPaymentByPayPalId(captureId);
		if (!payment) {
			return;
		}

		payment.status = PaymentStatus.FAILED;
		payment.failedAt = new Date();
		payment.completedAt = undefined;
		payment.metadata = {
			...payment.metadata,
			paypalTransactionId: captureId,
			webhookEventId: event.id,
		};

		await this.paymentHistoryRepository.save(payment);
		await this.invalidatePaymentHistoryCache(payment.userId);

		logger.apiUpdate('paypal_webhook', {
			eventId: event.id,
			eventType: event.event_type,
			paymentId: payment.providerTransactionId,
			status: 'denied',
		});
	}

	private async handleCaptureRefunded(event: PayPalWebhookEvent): Promise<void> {
		const captureId = event.resource?.id;
		if (!captureId) {
			return;
		}

		const payment = await this.findPaymentByPayPalId(captureId);
		if (!payment) {
			return;
		}

		payment.status = PaymentStatus.FAILED;
		payment.failedAt = new Date();
		payment.metadata = {
			...payment.metadata,
			paypalTransactionId: captureId,
			webhookEventId: event.id,
		};

		await this.paymentHistoryRepository.save(payment);
		await this.invalidatePaymentHistoryCache(payment.userId);

		logger.apiUpdate('paypal_webhook', {
			eventId: event.id,
			eventType: event.event_type,
			paymentId: payment.providerTransactionId,
			status: 'refunded',
		});
	}

	private async handleCapturePending(event: PayPalWebhookEvent): Promise<void> {
		const captureId = event.resource?.id;
		if (!captureId) {
			return;
		}

		const payment = await this.findPaymentByPayPalId(captureId);
		if (!payment) {
			return;
		}

		if (payment.status === PaymentStatus.PENDING) {
			return;
		}

		payment.status = PaymentStatus.PENDING;
		payment.completedAt = undefined;
		payment.failedAt = undefined;
		payment.metadata = {
			...payment.metadata,
			paypalTransactionId: captureId,
			webhookEventId: event.id,
		};

		await this.paymentHistoryRepository.save(payment);
		await this.invalidatePaymentHistoryCache(payment.userId);

		logger.apiUpdate('paypal_webhook', {
			eventId: event.id,
			eventType: event.event_type,
			paymentId: payment.providerTransactionId,
			status: 'pending',
		});
	}

	private async findPaymentByPayPalId(paypalId: string): Promise<PaymentHistoryEntity | null> {
		return await this.paymentHistoryRepository
			.createQueryBuilder('payment')
			.where("payment.metadata->>'paypalOrderId' = :paypalId", { paypalId })
			.orWhere("payment.metadata->>'paypalTransactionId' = :paypalId", {
				paypalId,
			})
			.getOne();
	}

	private async isEventProcessed(eventId: string): Promise<boolean> {
		try {
			const cacheKey = SERVER_CACHE_KEYS.PAYPAL.WEBHOOK_EVENT(eventId);
			const cached = await this.cacheService.get<string>(
				cacheKey,
				(value: unknown): value is string => typeof value === 'string'
			);
			return cached.success && cached.data !== null;
		} catch {
			return false;
		}
	}

	private async markEventAsProcessed(eventId: string): Promise<void> {
		try {
			const cacheKey = SERVER_CACHE_KEYS.PAYPAL.WEBHOOK_EVENT(eventId);
			await this.cacheService.set(cacheKey, 'processed', TIME_PERIODS_MS.WEEK);
		} catch (error) {
			logger.cacheError('mark webhook event as processed', SERVER_CACHE_KEYS.PAYPAL.WEBHOOK_EVENT(eventId), {
				errorInfo: { message: getErrorMessage(error) },
			});
		}
	}

	private async invalidatePaymentHistoryCache(userId: string): Promise<void> {
		try {
			await this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.PAYMENT.HISTORY(userId));
			await this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.PAYMENT.HISTORY_PATTERN);
		} catch (error) {
			logger.cacheError('invalidate payment history cache', SERVER_CACHE_KEYS.PAYMENT.HISTORY(userId), {
				errorInfo: { message: getErrorMessage(error) },
			});
		}
	}
}
