/**
 * Payment Service
 *
 * @module PaymentService
 * @description Service for handling payment operations (PayPal, Manual Credit, Payment History, Credit Purchase)
 * @used_by server/src/features/payment/payment.controller.ts
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
	CACHE_DURATION,
	CREDIT_PURCHASE_PACKAGES,
	ERROR_CODES,
	ERROR_MESSAGES,
	PaymentClientAction,
	PaymentMethod,
	PaymentStatus,
	VALID_PAYMENT_METHODS,
} from '@shared/constants';
import type {
	CreditBalance,
	CreditPurchaseOption,
	ManualPaymentDetails,
	PaymentData,
	PaymentResult,
	PayPalOrderRequest,
} from '@shared/types';
import { generatePaymentIntentId, getErrorMessage, sanitizeCardNumber } from '@shared/utils';
import { detectCardBrand, extractLastFourDigits, isCreditPurchaseOptionArray } from '@shared/utils/domain';

import { PaymentHistoryEntity, UserEntity } from '@internal/entities';
import { CacheService } from '@internal/modules/cache';
import { serverLogger as logger } from '@internal/services';
import type { PayPalConfig } from '@internal/types';
import { createNotFoundError, createServerError, createValidationError } from '@internal/utils';
import { isValidCardNumber } from '@internal/validation/domain';

import { AppConfig } from '../../config/app.config';

@Injectable()
export class PaymentService {
	constructor(
		@InjectRepository(PaymentHistoryEntity)
		private readonly paymentHistoryRepository: Repository<PaymentHistoryEntity>,
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly cacheService: CacheService
	) {}

	/**
	 * Get credit purchase options
	 * @returns Available credit purchase options
	 */
	async getCreditPurchaseOptions(): Promise<CreditPurchaseOption[]> {
		try {
			logger.paymentInfo('Getting credit purchase options');

			const cachedOptions = await this.cacheService.get<CreditPurchaseOption[]>(
				'credit_purchase_options',
				isCreditPurchaseOptionArray
			);
			if (cachedOptions.success && cachedOptions.data) {
				return cachedOptions.data;
			}

			await this.cacheService.set('credit_purchase_options', CREDIT_PURCHASE_PACKAGES, CACHE_DURATION.VERY_LONG);

			return [...CREDIT_PURCHASE_PACKAGES];
		} catch (error) {
			logger.paymentFailed('unknown', 'Failed to get credit purchase options', {
				error: getErrorMessage(error),
			});
			throw createServerError('retrieve credit options', error);
		}
	}

	/**
	 * Process payment
	 * @param userId User ID
	 * @param paymentData Payment data
	 * @returns Payment result
	 */
	async processPayment(userId: string, paymentData: PaymentData): Promise<PaymentResult> {
		let paymentHistory: PaymentHistoryEntity | null = null;

		try {
			this.ensureValidPaymentAmount(paymentData.amount);
			const normalizedAmount = this.normalizeAmount(paymentData.amount);
			const currency = (paymentData.currency ?? 'USD').toUpperCase();
			const transactionId = this.generateTransactionId();
			const method = paymentData.method ?? PaymentMethod.MANUAL_CREDIT;

			this.ensureValidPaymentMethod(method);

			logger.paymentInfo('Processing payment', {
				userId,
				paymentType: paymentData.type ?? 'unspecified',
				paymentMethod: method,
			});

			paymentHistory = this.paymentHistoryRepository.create({
				userId,
				amount: normalizedAmount,
				currency,
				status: PaymentStatus.PENDING,
				paymentMethod: method,
				description: paymentData.description,
			});

			paymentHistory.paymentId = transactionId;
			paymentHistory.transactionId = transactionId;

			paymentHistory.originalAmount = paymentData.amount;
			paymentHistory.originalCurrency = currency;
			paymentHistory.metadata = {
				...paymentData.metadata,
				originalAmount: paymentData.amount,
				originalCurrency: currency,
			};

			await this.paymentHistoryRepository.save(paymentHistory);
			logger.databaseCreate('payment_history', {
				id: paymentHistory.transactionId,
				userId,
				amount: paymentData.amount,
				paymentMethod: method,
			});

			const processingResult = await this.processPaymentByMethod(
				userId,
				paymentHistory,
				paymentData,
				normalizedAmount,
				currency,
				method
			);

			await this.paymentHistoryRepository.save(paymentHistory);

			if (processingResult.status === PaymentStatus.COMPLETED) {
				await this.handlePaymentSuccess(userId, paymentData);
				logger.paymentInfo('Payment processed successfully', {
					userId,
					id: paymentHistory.transactionId,
					amount: paymentData.amount,
					paymentMethod: method,
				});
			} else {
				logger.paymentInfo('Payment requires additional action', {
					userId,
					id: paymentHistory.transactionId,
					status: processingResult.status,
					paymentMethod: method,
				});
			}

			return processingResult;
		} catch (error) {
			if (paymentHistory) {
				paymentHistory.status = PaymentStatus.FAILED;
				paymentHistory.failedAt = new Date();
				await this.paymentHistoryRepository.save(paymentHistory);
			}

			logger.paymentFailed(paymentHistory?.transactionId ?? 'unknown', 'Payment processing error', {
				userId,
				error: getErrorMessage(error),
			});
			throw createServerError('process payment', new Error(ERROR_CODES.PAYMENT_PROCESSING_FAILED));
		}
	}

	private ensureValidPaymentAmount(amount: number | undefined): void {
		if (!amount || amount <= 0) {
			throw createValidationError('payment amount', 'number');
		}
	}

	private ensureValidPaymentMethod(method: PaymentMethod | undefined): void {
		if (!method || !VALID_PAYMENT_METHODS.includes(method)) {
			throw createValidationError('payment method', 'string');
		}
	}

	private normalizeAmount(amount: number): number {
		return Math.round(amount);
	}

	private async processPaymentByMethod(
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
				return this.processPayPalPayment(paymentHistory, paymentData, normalizedAmount, currency);
			default:
				logger.paymentFailed(paymentHistory.transactionId, 'Unsupported payment method', {
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
				manualCaptureReference: paymentHistory.transactionId,
			};

			return {
				paymentId: paymentHistory.transactionId,
				transactionId: paymentHistory.transactionId,
				status: PaymentStatus.REQUIRES_CAPTURE,
				message: 'Payment recorded and pending manual capture',
				amount: normalizedAmount,
				currency,
				paymentMethod: PaymentMethod.MANUAL_CREDIT,
				clientAction: PaymentClientAction.MANUAL_CAPTURE,
				manualCaptureReference: paymentHistory.transactionId,
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
			manualCaptureReference: paymentHistory.transactionId,
		};

		// Ensure sensitive fields are not retained
		manualDetails.cvv = '';
		manualDetails.cardNumber = lastFour;

		return {
			paymentId: paymentHistory.transactionId,
			transactionId: paymentHistory.transactionId,
			status: PaymentStatus.REQUIRES_CAPTURE,
			message: 'Payment recorded and pending manual capture',
			amount: normalizedAmount,
			currency,
			paymentMethod: PaymentMethod.MANUAL_CREDIT,
			clientAction: PaymentClientAction.MANUAL_CAPTURE,
			manualCaptureReference: paymentHistory.transactionId,
			metadata: paymentHistory.metadata,
		};
	}

	private processPayPalPayment(
		paymentHistory: PaymentHistoryEntity,
		paymentData: PaymentData,
		normalizedAmount: number,
		currency: string
	): PaymentResult {
		const paypalConfig = AppConfig.paypal;
		const requestPayload = this.buildPayPalOrderRequest(normalizedAmount, currency, paypalConfig);

		if (!paymentData.paypalOrderId && !paymentData.paypalPaymentId) {
			paymentHistory.status = PaymentStatus.REQUIRES_ACTION;
			paymentHistory.completedAt = undefined;
			paymentHistory.failedAt = undefined;
			paymentHistory.metadata = {
				...paymentHistory.metadata,
				paypalMerchantId: paypalConfig.merchantId,
			};

			return {
				paymentId: paymentHistory.transactionId,
				transactionId: paymentHistory.transactionId,
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

		const orderId = paymentData.paypalOrderId ?? paymentData.paypalPaymentId ?? paymentHistory.transactionId;

		paymentHistory.status = PaymentStatus.COMPLETED;
		paymentHistory.completedAt = new Date();
		paymentHistory.metadata = {
			...paymentHistory.metadata,
			paypalOrderId: orderId,
			paypalMerchantId: paypalConfig.merchantId,
			paypalTransactionId: orderId,
		};

		return {
			paymentId: paymentHistory.transactionId,
			transactionId: paymentHistory.transactionId,
			status: PaymentStatus.COMPLETED,
			message: 'Payment processed successfully via PayPal',
			amount: normalizedAmount,
			currency,
			paymentMethod: PaymentMethod.PAYPAL,
			clientAction: PaymentClientAction.COMPLETE,
			paypalOrderId: orderId,
			metadata: paymentHistory.metadata,
		};
	}

	private buildPayPalOrderRequest(amount: number, currency: string, config: PayPalConfig): PayPalOrderRequest {
		return {
			environment: config.environment,
			clientId: config.clientId,
			currencyCode: currency,
			amount: amount.toFixed(2),
			description: 'EveryTriv payment',
		};
	}

	private extractExpiryComponents(details: ManualPaymentDetails): { expiryMonth?: number; expiryYear?: number } {
		if (details.expiryMonth && details.expiryYear) {
			return { expiryMonth: details.expiryMonth, expiryYear: details.expiryYear };
		}

		if (details.expiryDate) {
			const match = details.expiryDate.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
			if (match) {
				return {
					expiryMonth: parseInt(match[1], 10),
					expiryYear: 2000 + parseInt(match[2], 10),
				};
			}
		}

		return {};
	}

	/**
	 * Get payment history for user
	 * @param userId User ID
	 * @param limit Number of records to return
	 * @param offset Number of records to skip
	 * @returns Payment history
	 */
	async getPaymentHistory(userId: string, limit: number = 10, offset: number = 0): Promise<PaymentHistoryEntity[]> {
		try {
			logger.paymentInfo('Getting payment history', { userId, limit, offset });

			const payments = await this.paymentHistoryRepository.find({
				where: { userId: userId },
				order: { createdAt: 'DESC' },
				take: limit,
				skip: offset,
			});

			return payments;
		} catch (error) {
			logger.paymentFailed('unknown', 'Failed to get payment history', {
				userId,
				error: getErrorMessage(error),
			});
			throw createServerError(
				'retrieve payment history',
				new Error(ERROR_MESSAGES.payment.FAILED_TO_RETRIEVE_PAYMENT_HISTORY)
			);
		}
	}

	/**
	 * Purchase credits
	 * @param userId User ID
	 * @param optionId Credit purchase option ID
	 * @returns Credit balance update result
	 */
	async purchaseCredits(userId: string, optionId: string): Promise<PaymentResult & { balance?: CreditBalance }> {
		try {
			logger.paymentInfo('Purchasing credits', { userId, id: optionId });

			const options = await this.getCreditPurchaseOptions();
			const selectedOption = options.find(opt => opt.id === optionId);

			if (!selectedOption) {
				throw createValidationError('credit option', 'string');
			}

			// Process payment
			const paymentResult = await this.processPayment(userId, {
				amount: selectedOption.price,
				currency: selectedOption.currency || 'USD',
				description: `Credits purchase: ${selectedOption.credits} credits`,
				metadata: {
					optionId,
					credits: selectedOption.credits,
					bonus: selectedOption.bonus ?? 0,
				},
				method: selectedOption.supportedMethods?.includes(PaymentMethod.PAYPAL)
					? PaymentMethod.PAYPAL
					: PaymentMethod.MANUAL_CREDIT,
			});

			if (paymentResult.status !== PaymentStatus.COMPLETED) {
				return paymentResult;
			}

			// Update user scoring
			const user = await this.userRepository.findOne({ where: { id: userId } });
			if (!user) {
				throw createNotFoundError('User');
			}

			const creditsToAdd = selectedOption.credits + (selectedOption.bonus ?? 0);
			user.credits = (user.credits ?? 0) + creditsToAdd;
			user.purchasedCredits = (user.purchasedCredits ?? 0) + creditsToAdd;
			await this.userRepository.save(user);

			// Invalidate credits cache
			await this.cacheService.delete(`credits:balance:${userId}`);

			logger.paymentInfo('Credits purchased successfully', {
				userId,
				credits: creditsToAdd,
				id: paymentResult.transactionId,
			});

			const creditsBalance = user.credits ?? 0;
			const purchasedCredits = user.purchasedCredits ?? 0;
			const freeQuestions = user.remainingFreeQuestions ?? 0;
			const totalCredits = creditsBalance + purchasedCredits + freeQuestions;

			const balance: CreditBalance = {
				totalCredits,
				credits: creditsBalance,
				purchasedCredits,
				freeQuestions,
				dailyLimit: user.dailyFreeQuestions ?? 0,
				canPlayFree: freeQuestions > 0,
				nextResetTime: user.lastFreeQuestionsReset ? user.lastFreeQuestionsReset.toISOString() : null,
				userId,
			};

			return {
				...paymentResult,
				balance,
			};
		} catch (error) {
			logger.paymentFailed('unknown', 'Failed to purchase credits', {
				userId,
				id: optionId,
				error: getErrorMessage(error),
			});
			throw createServerError('purchase credits', new Error(ERROR_CODES.FAILED_TO_PURCHASE_CREDITS));
		}
	}

	/**
	 * Handle successful payment
	 * @param userId User ID
	 * @param paymentData Payment data
	 */
	private async handlePaymentSuccess(userId: string, paymentData: PaymentData): Promise<void> {
		switch (paymentData.type) {
			case 'credits_purchase':
				// Credits purchase logic handled in purchaseCredits
				break;
			case 'one_time':
				// Handle one-time payment
				break;
			default:
				logger.paymentInfo('Unknown payment type', {
					userId,
					paymentType: paymentData.type,
				});
		}
	}

	/**
	 * Simulate payment processing
	 * @param paymentData Payment data
	 * @returns Payment success status
	 */
	/**
	 * Generate transaction ID
	 * @returns Transaction ID
	 */
	private generateTransactionId(): string {
		return generatePaymentIntentId();
	}
}
