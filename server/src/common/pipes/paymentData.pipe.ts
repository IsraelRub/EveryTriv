/**
 * Payment Data Validation Pipe
 *
 * @module PaymentDataPipe
 * @description Pipe for validating payment data input with comprehensive validation
 * @used_by server/src/features/payment, server/src/controllers
 */
// ValidationManager removed - using direct validation
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { PersonalPaymentData } from '@shared';
import { serverLogger as logger } from '@shared';

export interface PaymentDataValidationResult {
	isValid: boolean;
	errors: string[];
	success: boolean;
	timestamp: string;
}

@Injectable()
export class PaymentDataPipe implements PipeTransform {
	async transform(value: PersonalPaymentData): Promise<PaymentDataValidationResult> {
		const startTime = Date.now();

		try {
			logger.validationDebug('payment_data', '[REDACTED]', 'validation_start');

			// Perform basic validation
			const validationResult = this.validatePaymentData(value);

			// Log validation result
			if (validationResult.isValid) {
				logger.validationInfo('payment_data', '[REDACTED]', 'validation_success');
			} else {
				logger.validationWarn('payment_data', '[REDACTED]', 'validation_failed', {
					errors: validationResult.errors,
				});
			}

			// Log API call
			logger.apiUpdate('payment_data_validation', {
				isValid: validationResult.isValid,
				errorsCount: validationResult.errors.length,
				duration: Date.now() - startTime,
			});

			return {
				isValid: validationResult.isValid,
				errors: validationResult.errors,
				success: true,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			logger.validationError('payment_data', '[REDACTED]', 'validation_error', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});

			logger.apiUpdateError('paymentDataValidation', error instanceof Error ? error.message : 'Unknown error');

			throw new BadRequestException('Payment data validation failed');
		}
	}

	private validatePaymentData(data: PersonalPaymentData): { isValid: boolean; errors: string[] } {
		const errors: string[] = [];

		// Basic validation
		if (!data) {
			errors.push('Payment data is required');
			return { isValid: false, errors };
		}

		// Validate required fields
		if (!data.cardNumber || typeof data.cardNumber !== 'string' || data.cardNumber.length < 13) {
			errors.push('Valid card number is required');
		}

		if (!data.expiryDate || typeof data.expiryDate !== 'string') {
			errors.push('Valid expiry date is required');
		}

		if (!data.cvv || typeof data.cvv !== 'string' || data.cvv.length < 3) {
			errors.push('Valid CVV is required');
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}
}
