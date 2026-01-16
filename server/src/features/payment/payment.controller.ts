import { Body, Controller, Get, HttpException, HttpStatus, Post } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

import { API_ENDPOINTS, ERROR_CODES, PaymentMethod, PaymentStatus, TIME_DURATIONS_SECONDS } from '@shared/constants';
import type { PaymentData } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';

import { Cache, CurrentUserId } from '../../common';
import { PaymentDataPipe } from '../../common/pipes';
import { CreditsService } from '../credits/credits.service';
import { PurchaseCreditsDto } from '../credits/dtos';
import { CreatePaymentDto } from './dtos';
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
				? this.paymentService.buildManualPaymentDetails(paymentData)
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
		return await this.paymentService.processPayment(userId, paymentDataForService);
	}

	@Get('history')
	@Cache(TIME_DURATIONS_SECONDS.THIRTY_MINUTES)
	async getPaymentHistory(@CurrentUserId() userId: string) {
		return await this.paymentService.getPaymentHistory(userId);
	}

	@Post('purchase-credits')
	async purchaseCredits(@CurrentUserId() userId: string, @Body(PaymentDataPipe) body: PurchaseCreditsDto) {
		try {
			const packageInfo = this.paymentService.getPackageInfo(body.packageId);
			if (!packageInfo) {
				throw new HttpException(ERROR_CODES.INVALID_CREDITS_PACKAGE, HttpStatus.BAD_REQUEST);
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
					body.paymentMethod === PaymentMethod.MANUAL_CREDIT
						? this.paymentService.buildManualPaymentDetails(body)
						: undefined;

				const paymentData: PaymentData = {
					amount: packageInfo.price,
					currency: 'USD',
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

				const paymentResult = await this.paymentService.processPaymentWithTransaction(
					transactionManager,
					userId,
					paymentData
				);

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
}
