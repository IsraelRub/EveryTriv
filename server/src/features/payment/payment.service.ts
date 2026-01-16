import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import {
	CREDIT_PURCHASE_PACKAGES,
	CREDIT_PURCHASE_PACKAGES_BY_CREDITS,
	ERROR_CODES,
	ERROR_MESSAGES,
	PaymentClientAction,
	PaymentMethod,
	PaymentStatus,
	SERVER_CACHE_KEYS,
	TIME_DURATIONS_SECONDS,
	VALID_PAYMENT_METHODS_SET,
} from '@shared/constants';
import type {
	CreditPurchaseOption,
	ManualPaymentDetails,
	PaymentData,
	PaymentResult,
	PayPalOrderRequest,
} from '@shared/types';
import { generatePaymentIntentId, getErrorMessage, sanitizeCardNumber } from '@shared/utils';
import { detectCardBrand, extractLastFourDigits, isCreditPurchaseOptionArray } from '@shared/utils/domain';
import { isValidCardNumber } from '@shared/validation';

import { AppConfig } from '@config';
import { PaymentHistoryEntity } from '@internal/entities';
import { CacheService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import type { PayPalConfig } from '@internal/types';
import { createServerError, createValidationError } from '@internal/utils';

import type { PaymentMethodDetailsDto } from './dtos/payment.dto';
import { PayPalApiService } from './providers/paypal';

@Injectable()
export class PaymentService {
	constructor(
		@InjectRepository(PaymentHistoryEntity)
		private readonly paymentHistoryRepository: Repository<PaymentHistoryEntity>,
		private readonly cacheService: CacheService,
		private readonly paypalApiService: PayPalApiService
	) {}

	async getCreditPurchaseOptions(): Promise<CreditPurchaseOption[]> {
		try {
			const cachedOptions = await this.cacheService.get<CreditPurchaseOption[]>(
				SERVER_CACHE_KEYS.CREDITS.PURCHASE_OPTIONS,
				isCreditPurchaseOptionArray
			);
			if (cachedOptions.success && cachedOptions.data) {
				return cachedOptions.data;
			}

			await this.cacheService.set(
				SERVER_CACHE_KEYS.CREDITS.PURCHASE_OPTIONS,
				CREDIT_PURCHASE_PACKAGES,
				TIME_DURATIONS_SECONDS.HOUR
			);

			return [...CREDIT_PURCHASE_PACKAGES];
		} catch (error) {
			logger.paymentFailed('unknown', 'Failed to get credit purchase options', {
				errorInfo: { message: getErrorMessage(error) },
			});
			throw createServerError('retrieve credit options', error);
		}
	}

	async processPayment(userId: string, paymentData: PaymentData): Promise<PaymentResult> {
		return this.processPaymentInternal(null, userId, paymentData);
	}

	async processPaymentWithTransaction(
		entityManager: EntityManager,
		userId: string,
		paymentData: PaymentData
	): Promise<PaymentResult> {
		return this.processPaymentInternal(entityManager, userId, paymentData);
	}

	private async processPaymentInternal(
		entityManager: EntityManager | null,
		userId: string,
		paymentData: PaymentData
	): Promise<PaymentResult> {
		const repo = entityManager ? entityManager.getRepository(PaymentHistoryEntity) : this.paymentHistoryRepository;
		let paymentHistory: PaymentHistoryEntity | null = null;

		try {
			this.ensureValidPaymentAmount(paymentData.amount);
			const normalizedAmount = this.normalizeAmount(paymentData.amount);
			const currency = (paymentData.currency ?? 'USD').toUpperCase();
			const transactionId = generatePaymentIntentId();
			const method = paymentData.method ?? PaymentMethod.MANUAL_CREDIT;

			this.ensureValidPaymentMethod(method);

			paymentHistory = repo.create({
				userId,
				amount: normalizedAmount,
				currency,
				status: PaymentStatus.PENDING,
				paymentMethod: method,
				description: paymentData.description,
			});

			paymentHistory.providerTransactionId = transactionId;

			paymentHistory.metadata = {
				...paymentData.metadata,
				originalAmount: paymentData.amount,
				originalCurrency: currency,
			};

			await repo.save(paymentHistory);

			const processingResult = await this.processPaymentByMethodInternal(
				userId,
				paymentHistory,
				paymentData,
				normalizedAmount,
				currency,
				method
			);

			await repo.save(paymentHistory);

			logger.apiCreate('payment_create', {
				userId,
				paymentId: processingResult.paymentId,
				status: processingResult.status,
				amount: paymentData.amount,
				method,
			});

			if (processingResult.status === PaymentStatus.COMPLETED) {
				await this.invalidatePaymentHistoryCache(userId);
			}

			return processingResult;
		} catch (error) {
			if (paymentHistory) {
				paymentHistory.status = PaymentStatus.FAILED;
				paymentHistory.failedAt = new Date();
				await repo.save(paymentHistory);
			}

			const errorMessage = getErrorMessage(error);
			logger.paymentFailed(paymentHistory?.providerTransactionId ?? 'unknown', 'Payment processing error', {
				userId,
				errorInfo: { message: errorMessage },
			});
			if (error instanceof Error && error.message) {
				throw createServerError('process payment', error);
			}
			throw createServerError('process payment', new Error(ERROR_CODES.PAYMENT_PROCESSING_FAILED));
		}
	}

	private ensureValidPaymentAmount(amount: number | undefined): void {
		if (!amount || amount <= 0) {
			throw createValidationError('payment amount', 'number');
		}
	}

	private ensureValidPaymentMethod(method: PaymentMethod | undefined): void {
		if (!method || !VALID_PAYMENT_METHODS_SET.has(method)) {
			throw createValidationError('payment method', 'string');
		}
	}

	private normalizeAmount(amount: number): number {
		return Math.round(amount * 100);
	}

	private async processPaymentByMethodInternal(
		userId: string,
		paymentHistory: PaymentHistoryEntity,
		paymentData: PaymentData,
		normalizedAmount: number,
		currency: string,
		method: PaymentMethod
	): Promise<PaymentResult> {
		switch (method) {
			case PaymentMethod.MANUAL_CREDIT:
				return this.processManualCreditPayment(paymentHistory, paymentData, normalizedAmount, currency);
			case PaymentMethod.PAYPAL:
				return await this.processPayPalPayment(paymentHistory, paymentData, normalizedAmount, currency);
			default:
				logger.paymentFailed(paymentHistory.providerTransactionId, 'Unsupported payment method', {
					userId,
					method,
				});
				throw createValidationError('payment method', 'string');
		}
	}

	private processManualCreditPayment(
		paymentHistory: PaymentHistoryEntity,
		paymentData: PaymentData,
		normalizedAmount: number,
		currency: string
	): PaymentResult {
		const manualDetails = paymentData.manualPayment;
		if (!manualDetails) {
			paymentHistory.status = PaymentStatus.REQUIRES_CAPTURE;
			paymentHistory.completedAt = undefined;
			paymentHistory.failedAt = undefined;
			paymentHistory.metadata = {
				...paymentHistory.metadata,
				manualCaptureReference: paymentHistory.providerTransactionId,
			};

			return {
				paymentId: paymentHistory.providerTransactionId,
				status: PaymentStatus.REQUIRES_CAPTURE,
				message: 'Payment recorded and pending manual capture',
				amount: normalizedAmount,
				currency,
				paymentMethod: PaymentMethod.MANUAL_CREDIT,
				clientAction: PaymentClientAction.MANUAL_CAPTURE,
				manualCaptureReference: paymentHistory.providerTransactionId,
				metadata: paymentHistory.metadata,
			};
		}

		const sanitizedCardNumber = sanitizeCardNumber(manualDetails.cardNumber);
		if (!isValidCardNumber(sanitizedCardNumber)) {
			throw createValidationError('card number', 'string');
		}

		const { expiryMonth, expiryYear } = this.extractExpiryComponents(manualDetails);
		const cardBrand = detectCardBrand(sanitizedCardNumber);
		const lastFour = extractLastFourDigits(sanitizedCardNumber);

		paymentHistory.status = PaymentStatus.REQUIRES_CAPTURE;
		paymentHistory.completedAt = undefined;
		paymentHistory.failedAt = undefined;
		paymentHistory.metadata = {
			...paymentHistory.metadata,
			cardLast4: lastFour,
			cardBrand,
			cardExpirationMonth: expiryMonth,
			cardExpirationYear: expiryYear,
			manualCaptureReference: paymentHistory.providerTransactionId,
		};

		manualDetails.cvv = '';
		manualDetails.cardNumber = lastFour;

		return {
			paymentId: paymentHistory.providerTransactionId,
			status: PaymentStatus.REQUIRES_CAPTURE,
			message: 'Payment recorded and pending manual capture',
			amount: normalizedAmount,
			currency,
			paymentMethod: PaymentMethod.MANUAL_CREDIT,
			clientAction: PaymentClientAction.MANUAL_CAPTURE,
			manualCaptureReference: paymentHistory.providerTransactionId,
			metadata: paymentHistory.metadata,
		};
	}

	private async processPayPalPayment(
		paymentHistory: PaymentHistoryEntity,
		paymentData: PaymentData,
		normalizedAmount: number,
		currency: string
	): Promise<PaymentResult> {
		const paypalConfig = AppConfig.paypal;
		const requestPayload = this.buildPayPalOrderRequest(normalizedAmount, currency, paypalConfig);
		const expectedAmount = normalizedAmount / 100;

		if (!paymentData.paypalOrderId && !paymentData.paypalPaymentId) {
			paymentHistory.status = PaymentStatus.REQUIRES_ACTION;
			paymentHistory.completedAt = undefined;
			paymentHistory.failedAt = undefined;
			paymentHistory.metadata = {
				...paymentHistory.metadata,
				paypalMerchantId: paypalConfig.merchantId,
			};

			return {
				paymentId: paymentHistory.providerTransactionId,
				status: PaymentStatus.REQUIRES_ACTION,
				message: 'PayPal order ID required to finalize payment',
				amount: normalizedAmount,
				currency,
				paymentMethod: PaymentMethod.PAYPAL,
				clientAction: PaymentClientAction.CONFIRM_PAYPAL,
				paypalOrderRequest: requestPayload,
				metadata: paymentHistory.metadata,
			};
		}

		const orderId = paymentData.paypalOrderId ?? paymentData.paypalPaymentId ?? paymentHistory.providerTransactionId;
		if (!this.isValidPayPalId(orderId)) {
			throw createValidationError('PayPal order/payment ID', 'string');
		}

		try {
			const order = await this.paypalApiService.getOrderDetails(orderId);

			if (!this.paypalApiService.isOrderApproved(order)) {
				paymentHistory.status = PaymentStatus.FAILED;
				paymentHistory.failedAt = new Date();
				paymentHistory.metadata = {
					...paymentHistory.metadata,
					paypalOrderId: orderId,
					paypalMerchantId: paypalConfig.merchantId,
					paypalOrderStatus: order.status,
				};

				return {
					paymentId: paymentHistory.providerTransactionId,
					status: PaymentStatus.FAILED,
					message: `PayPal order status is ${order.status}, expected APPROVED or COMPLETED`,
					amount: normalizedAmount,
					currency,
					paymentMethod: PaymentMethod.PAYPAL,
					clientAction: PaymentClientAction.CONFIRM_PAYPAL,
					metadata: paymentHistory.metadata,
				};
			}

			if (!this.paypalApiService.validateOrderAmount(order, expectedAmount, currency)) {
				paymentHistory.status = PaymentStatus.FAILED;
				paymentHistory.failedAt = new Date();
				paymentHistory.metadata = {
					...paymentHistory.metadata,
					paypalOrderId: orderId,
					paypalMerchantId: paypalConfig.merchantId,
				};

				return {
					paymentId: paymentHistory.providerTransactionId,
					status: PaymentStatus.FAILED,
					message: 'PayPal order amount or currency does not match expected values',
					amount: normalizedAmount,
					currency,
					paymentMethod: PaymentMethod.PAYPAL,
					clientAction: PaymentClientAction.CONFIRM_PAYPAL,
					metadata: paymentHistory.metadata,
				};
			}

			let captureResult = null;
			if (this.paypalApiService.needsCapture(order)) {
				captureResult = await this.paypalApiService.captureOrder(orderId);
			}

			const finalOrder = captureResult ? { ...order, status: captureResult.status } : order;
			const captureId =
				captureResult?.purchase_units?.[0]?.payments?.captures?.[0]?.id ??
				order.purchase_units?.[0]?.payments?.captures?.[0]?.id ??
				orderId;

			paymentHistory.status = PaymentStatus.COMPLETED;
			paymentHistory.completedAt = new Date();
			paymentHistory.metadata = {
				...paymentHistory.metadata,
				paypalOrderId: orderId,
				paypalMerchantId: paypalConfig.merchantId,
				paypalTransactionId: captureId,
				paypalOrderStatus: finalOrder.status,
			};

			return {
				paymentId: paymentHistory.providerTransactionId,
				status: PaymentStatus.COMPLETED,
				message: 'Payment processed successfully via PayPal',
				amount: normalizedAmount,
				currency,
				paymentMethod: PaymentMethod.PAYPAL,
				clientAction: PaymentClientAction.COMPLETE,
				paypalOrderId: orderId,
				metadata: paymentHistory.metadata,
			};
		} catch (error) {
			paymentHistory.status = PaymentStatus.FAILED;
			paymentHistory.failedAt = new Date();
			paymentHistory.metadata = {
				...paymentHistory.metadata,
				paypalOrderId: orderId,
				paypalMerchantId: paypalConfig.merchantId,
			};

			const errorMessage = getErrorMessage(error);
			logger.paymentFailed(orderId, 'PayPal payment processing failed', {
				errorInfo: { message: errorMessage },
			});

			throw createServerError('process PayPal payment', error);
		}
	}

	private isValidPayPalId(id: string): boolean {
		if (!id || typeof id !== 'string') {
			return false;
		}
		return id.trim().length >= 10 && /^[A-Z0-9_-]+$/i.test(id);
	}

	private buildPayPalOrderRequest(amount: number, currency: string, config: PayPalConfig): PayPalOrderRequest {
		const amountInDollars = amount / 100;
		return {
			environment: config.environment,
			clientId: config.clientId,
			currencyCode: currency,
			amount: amountInDollars.toFixed(2),
			description: 'EveryTriv payment',
		};
	}

	private extractExpiryComponents(details: ManualPaymentDetails): {
		expiryMonth?: number;
		expiryYear?: number;
	} {
		if (details.expiryMonth && details.expiryYear) {
			return {
				expiryMonth: details.expiryMonth,
				expiryYear: details.expiryYear,
			};
		}

		if (details.expiryDate) {
			const match = details.expiryDate.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
			if (match?.[1] != null && match[2] != null) {
				return {
					expiryMonth: parseInt(match[1], 10),
					expiryYear: 2000 + parseInt(match[2], 10),
				};
			}
		}

		return {};
	}

	async getPaymentHistory(userId: string, limit: number = 10, offset: number = 0): Promise<PaymentHistoryEntity[]> {
		try {
			const payments = await this.paymentHistoryRepository.find({
				where: { userId: userId },
				order: { createdAt: 'DESC' },
				take: limit,
				skip: offset,
			});

			logger.apiRead('payment_history', {
				userId,
				paymentsCount: payments.length,
			});

			return payments;
		} catch (error) {
			logger.paymentFailed('unknown', 'Failed to get payment history', {
				userId,
				errorInfo: { message: getErrorMessage(error) },
			});
			throw createServerError(
				'retrieve payment history',
				new Error(ERROR_MESSAGES.payment.FAILED_TO_RETRIEVE_PAYMENT_HISTORY)
			);
		}
	}

	private async invalidatePaymentHistoryCache(userId: string): Promise<void> {
		try {
			await this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.PAYMENT.HISTORY(userId));
			await this.cacheService.invalidatePattern(SERVER_CACHE_KEYS.PAYMENT.HISTORY_PATTERN);
		} catch (error) {
			logger.cacheError('invalidate payment history cache', `payment:history:${userId}`, {
				errorInfo: { message: getErrorMessage(error) },
			});
		}
	}

	getPackageInfo(packageId: string): CreditPurchaseOption | null {
		const creditsMatch = packageId.match(/package_(\d+)/);
		if (!creditsMatch?.[1]) return null;

		const credits = parseInt(creditsMatch[1]);
		return CREDIT_PURCHASE_PACKAGES_BY_CREDITS.get(credits) ?? null;
	}

	async findByPaypalOrderId(orderId: string): Promise<PaymentHistoryEntity | null> {
		return await this.paymentHistoryRepository
			.createQueryBuilder('payment')
			.where("payment.metadata->>'paypalOrderId' = :orderId", { orderId })
			.getOne();
	}

	buildManualPaymentDetails(dto: PaymentMethodDetailsDto): ManualPaymentDetails {
		if (!dto.cardNumber || !dto.cvv) {
			throw new BadRequestException(ERROR_CODES.CARD_DETAILS_REQUIRED);
		}
		const { month, year } = this.parseExpiryDate(dto.expiryDate);
		return {
			cardNumber: dto.cardNumber,
			expiryMonth: month,
			expiryYear: year,
			cvv: dto.cvv,
			cardHolderName: dto.cardHolderName ?? '',
			postalCode: dto.postalCode,
			expiryDate: dto.expiryDate,
		};
	}

	private parseExpiryDate(expiryDate?: string): {
		month: number;
		year: number;
	} {
		if (!expiryDate) {
			return { month: 0, year: 0 };
		}

		const [monthPart, yearPart] = expiryDate.split('/');
		const month = parseInt(monthPart ?? '0', 10);
		const year = 2000 + parseInt(yearPart ?? '0', 10);

		return { month, year };
	}
}
