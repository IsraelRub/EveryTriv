/**
 * Payment service for EveryTriv client
 * Handles payment processing and payment history
 *
 * @module ClientPaymentService
 * @description Client-side payment management
 * @used_by client/src/views/payment, client/src/components/payment, client/src/hooks
 */
import { PaymentMethod, PlanType } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { PaymentResult } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { apiService } from './api.service';

/**
 * Main payment service class
 * @class ClientPaymentService
 * @description Handles all payment operations for the client
 * @used_by client/src/views/payment, client/src/components/payment
 */
class ClientPaymentService {
	/**
	 * Create payment
	 */
	async createPayment(paymentData: {
		amount?: number;
		currency?: string;
		description?: string;
		planType?: PlanType;
		numberOfPayments?: number;
		paymentMethod: PaymentMethod;
		cardNumber?: string;
		expiryDate?: string;
		cvv?: string;
		cardHolderName?: string;
		postalCode?: string;
		paypalOrderId?: string;
		paypalPaymentId?: string;
		agreeToTerms?: boolean;
		additionalInfo?: string;
	}): Promise<PaymentResult> {
		try {
			logger.userInfo('Creating payment', {
				amount: paymentData.amount,
				planType: paymentData.planType,
				paymentMethod: paymentData.paymentMethod,
			});

			const result = await apiService.createPayment(paymentData);

			logger.userInfo('Payment created successfully', {
				paymentId: result.paymentId,
				status: result.status,
			});
			return result;
		} catch (error) {
			logger.userError('Failed to create payment', {
				error: getErrorMessage(error),
				amount: paymentData.amount,
				planType: paymentData.planType,
			});
			throw error;
		}
	}

	/**
	 * Get payment history
	 */
	async getPaymentHistory(): Promise<PaymentResult[]> {
		try {
			logger.userInfo('Getting payment history');

			const history = await apiService.getPaymentHistory();

			logger.userInfo('Payment history retrieved successfully', {
				count: history.length,
			});
			return history;
		} catch (error) {
			logger.userError('Failed to get payment history', { error: getErrorMessage(error) });
			throw error;
		}
	}
}

export const paymentService = new ClientPaymentService();
