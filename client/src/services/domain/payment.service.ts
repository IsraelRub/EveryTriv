/**
 * Payment service for EveryTriv client
 * Handles payment processing and payment history
 *
 * @module ClientPaymentService
 * @description Client-side payment management
 * @used_by client/src/views/payment, client/src/components/payment, client/src/hooks
 */
import { API_ROUTES, PaymentMethod } from '@shared/constants';
import type { PaymentResult } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { apiService, clientLogger as logger } from '@/services';

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
		paymentMethod: PaymentMethod;
		cardNumber?: string;
		expiryDate?: string;
		cvv?: string;
		cardHolderName?: string;
		postalCode?: string;
		paypalOrderId?: string;
		paypalPaymentId?: string;
		additionalInfo?: string;
	}): Promise<PaymentResult> {
		// Validate payment data
		if (!paymentData.paymentMethod) {
			throw new Error('Payment method is required');
		}

		try {
			logger.userInfo('Creating payment', {
				amount: paymentData.amount,
				paymentMethod: paymentData.paymentMethod,
			});

			const response = await apiService.post<PaymentResult>(API_ROUTES.PAYMENT.CREATE, paymentData);
			const result = response.data;

			logger.userInfo('Payment created successfully', {
				paymentId: result.paymentId,
				status: result.status,
			});
			return result;
		} catch (error) {
			logger.userError('Failed to create payment', {
				error: getErrorMessage(error),
				amount: paymentData.amount,
			});
			throw error;
		}
	}

	/**
	 * Get payment history
	 * @returns List of payment history entries
	 */
	async getPaymentHistory(): Promise<PaymentResult[]> {
		try {
			logger.userInfo('Getting payment history');

			const response = await apiService.get<PaymentResult[]>(API_ROUTES.PAYMENT.HISTORY);
			const history = response.data;

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
