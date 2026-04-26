import { Body, Controller, Get, HttpException, HttpStatus, Post } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

import {
	API_ENDPOINTS,
	ErrorCode,
	PaymentMethod,
	PaymentStatus,
	PurchaseCurrency,
	TIME_DURATIONS_SECONDS,
} from '@shared/constants';
import type { ManualPaymentDetails, PaymentData } from '@shared/types';
import { getErrorMessage } from '@shared/utils';
import { isPurchaseCurrency } from '@shared/validation';

import { Cache, CurrentUserId } from '@common/decorators';
import { PaymentDataPipe } from '@common/pipes';
import { serverLogger as logger } from '@internal/services';

import { CreditsService } from '../credits/credits.service';
import { PurchaseCreditsDto } from '../credits/dtos';
import { CreatePaymentDto, PaymentMethodDetailsDto } from './dtos';
import { PaymentService } from './payment.service';

@Controller(API_ENDPOINTS.PAYMENT.BASE)
export class PaymentController {
	constructor(
		private readonly paymentService: PaymentService,
		private readonly creditsService: CreditsService,
		@InjectEntityManager() private readonly entityManager: EntityManager
	) {}

	@Post('create')
	async createPayment(@CurrentUserId() userId: string, @Body(PaymentDataPipe) paymentData: CreatePaymentDto) {
		const manualPayment =
			paymentData.paymentMethod === PaymentMethod.MANUAL_CREDIT
				? this.buildManualPaymentDetails(paymentData)
				: undefined;
		const paymentDataForService: PaymentData = {
			amount: paymentData.amount ?? 0,
			currency: paymentData.currency ?? 'USD',
			description: paymentData.description ?? 'EveryTriv payment',
			metadata: {
				paymentMethod: paymentData.paymentMethod,
				tags: paymentData.additionalInfo ? [paymentData.additionalInfo] : undefined,
			},
			method: paymentData.paymentMethod,
			manualPayment,
			paypalOrderId: paymentData.paymentMethod === PaymentMethod.PAYPAL ? paymentData.paypalOrderId : undefined,
			paypalPaymentId: paymentData.paymentMethod === PaymentMethod.PAYPAL ? paymentData.paypalPaymentId : undefined,
		};
		return this.paymentService.processPayment(userId, paymentDataForService);
	}

	@Get('history')
	@Cache(TIME_DURATIONS_SECONDS.THIRTY_MINUTES)
	async getPaymentHistory(@CurrentUserId() userId: string) {
		return this.paymentService.getPaymentHistory(userId);
	}

	@Post('purchase-credits')
	async purchaseCredits(@CurrentUserId() userId: string, @Body(PaymentDataPipe) body: PurchaseCreditsDto) {
		try {
			const packageInfo = await this.creditsService.getPackageById(body.packageId);
			if (!packageInfo) {
				throw new HttpException(ErrorCode.INVALID_CREDITS_PACKAGE, HttpStatus.BAD_REQUEST);
			}

			if (body.paypalOrderId) {
				const existing = await this.paymentService.findByPaypalOrderId(body.paypalOrderId);
				if (existing?.status === PaymentStatus.COMPLETED) {
					const balance = await this.creditsService.getCreditBalance(userId);
					return {
						status: PaymentStatus.COMPLETED,
						message: 'Payment already processed',
						paymentId: existing.providerTransactionId,
						balance,
					};
				}
			}

			return await this.entityManager.transaction(async transactionManager => {
				const manualPayment =
					body.paymentMethod === PaymentMethod.MANUAL_CREDIT ? this.buildManualPaymentDetails(body) : undefined;

				const currencyRaw = body.currency ?? PurchaseCurrency.USD;
				const currency = isPurchaseCurrency(currencyRaw) ? currencyRaw : PurchaseCurrency.USD;
				if (
					currency === PurchaseCurrency.ILS &&
					(!Number.isFinite(packageInfo.priceIls) || packageInfo.priceIls <= 0)
				) {
					throw new HttpException(ErrorCode.CREDITS_PACKAGE_PRICE_ILS_MISSING, HttpStatus.BAD_REQUEST);
				}
				const amount = currency === PurchaseCurrency.ILS ? packageInfo.priceIls : packageInfo.price;

				const paymentData: PaymentData = {
					amount,
					currency,
					description: `Credits purchase: ${packageInfo.credits} credits`,
					metadata: {
						packageId: body.packageId,
						credits: packageInfo.credits,
						price: packageInfo.price,
					},
					method: body.paymentMethod,
					paypalOrderId: body.paypalOrderId,
					paypalPaymentId: body.paypalPaymentId,
					manualPayment,
				};

				const paymentResult = await this.paymentService.processPayment(userId, paymentData, transactionManager);

				if (paymentResult.status !== PaymentStatus.COMPLETED) {
					return paymentResult;
				}

				const balance = await this.creditsService.addCredits(
					transactionManager,
					userId,
					packageInfo.credits,
					paymentResult.paymentId ?? ''
				);

				logger.apiCreate('credits_purchase', {
					userId,
					packageId: body.packageId,
					credits: packageInfo.credits,
					paymentId: paymentResult.paymentId,
				});

				return { ...paymentResult, balance };
			});
		} catch (error) {
			logger.paymentFailed('unknown', 'Credit purchase failed', {
				errorInfo: { message: getErrorMessage(error) },
				userId,
				packageId: body.packageId,
			});
			throw error;
		}
	}

	private buildManualPaymentDetails(dto: PaymentMethodDetailsDto): ManualPaymentDetails {
		if (!dto.cardNumber || !dto.cvv) {
			throw new HttpException(ErrorCode.CARD_DETAILS_REQUIRED, HttpStatus.BAD_REQUEST);
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

	private parseExpiryDate(expiryDate?: string): { month: number; year: number } {
		if (!expiryDate) {
			return { month: 0, year: 0 };
		}

		const [monthPart, yearPart] = expiryDate.split('/');
		const month = parseInt(monthPart ?? '0', 10);
		const year = 2000 + parseInt(yearPart ?? '0', 10);

		return { month, year };
	}
}
