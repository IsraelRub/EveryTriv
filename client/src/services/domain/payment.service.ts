import { API_ENDPOINTS } from '@shared/constants';
import type { CreditsPurchaseRequest, PaymentResult } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { apiService, clientLogger as logger } from '@/services';
import type { CreditsPurchaseResponse } from '@/types';

class PaymentService {
	async getPaymentHistory(): Promise<PaymentResult[]> {
		try {
			const response = await apiService.get<PaymentResult[]>(API_ENDPOINTS.PAYMENT.HISTORY);
			return response.data;
		} catch (error) {
			logger.userError('Failed to get payment history', { errorInfo: { message: getErrorMessage(error) } });
			throw error;
		}
	}

	async purchaseCredits(request: CreditsPurchaseRequest): Promise<CreditsPurchaseResponse> {
		try {
			const response = await apiService.post<CreditsPurchaseResponse>(API_ENDPOINTS.PAYMENT.PURCHASE_CREDITS, request);
			return response.data;
		} catch (error) {
			logger.userError('Failed to purchase credits', {
				errorInfo: { message: getErrorMessage(error) },
				packageId: request.packageId,
			});
			throw error;
		}
	}
}

export const paymentService = new PaymentService();
