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
import { VALIDATION_MESSAGES } from '@/constants';
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
			throw new Error(VALIDATION_MESSAGES.FIELD_REQUIRED('Payment method'));
		}

		try {
			const response = await apiService.post<PaymentResult>(API_ROUTES.PAYMENT.CREATE, paymentData);
			return response.data;
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
			const response = await apiService.get<PaymentResult[]>(API_ROUTES.PAYMENT.HISTORY);
			return response.data;
		} catch (error) {
			logger.userError('Failed to get payment history', { error: getErrorMessage(error) });
			throw error;
		}
	}
}

export const paymentService = new ClientPaymentService();
