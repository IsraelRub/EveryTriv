/**
 * Payment Data Validation Pipe
 *
 * @module PaymentDataPipe
 * @description Pipe for validating payment data input with comprehensive validation
 * @used_by server/src/features/payment, server/src/controllers
 */
// ValidationManager removed - using direct validation
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { serverLogger as logger } from '@shared/services';
import type { PersonalPaymentData } from '@shared/types';
import { getErrorMessage,ValidationResult } from '@shared/utils';

@Injectable()
export class PaymentDataPipe implements PipeTransform {
	async transform(value: PersonalPaymentData): Promise<ValidationResult> {
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
				suggestion: validationResult.suggestion,
			};
		} catch (error) {
			logger.validationError('payment_data', '[REDACTED]', 'validation_error', {
				error: getErrorMessage(error),
			});

			logger.apiUpdateError('paymentDataValidation', getErrorMessage(error));

			throw new BadRequestException('Payment data validation failed');
		}
	}

	private validatePaymentData(data: PersonalPaymentData): ValidationResult {
		const errors: string[] = [];
		const suggestions: string[] = [];

		// Basic validation
		if (!data) {
			errors.push('Payment data is required');
			suggestions.push('Please provide your payment information');
			return { isValid: false, errors, suggestion: suggestions[0] };
		}

		// Validate card number
		if (!data.cardNumber || typeof data.cardNumber !== 'string') {
			errors.push('Card number is required');
			suggestions.push('Please enter your 16-digit card number');
		} else {
			const cleanCardNumber = data.cardNumber.replace(/\s+/g, '');
			if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
				errors.push('Card number must be between 13-19 digits');
				suggestions.push('Enter a valid card number (13-19 digits without spaces)');
			} else if (!/^\d+$/.test(cleanCardNumber)) {
				errors.push('Card number can only contain digits');
				suggestions.push('Remove any letters or special characters from your card number');
			}
		}

		// Validate expiry date
		if (!data.expiryDate || typeof data.expiryDate !== 'string') {
			errors.push('Expiry date is required');
			suggestions.push('Please enter your card expiry date');
		} else {
			const expiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;
			if (!expiryPattern.test(data.expiryDate)) {
				errors.push('Expiry date must be in MM/YY format');
				suggestions.push('Use MM/YY format (e.g., 12/25 for December 2025)');
			} else {
				const [month, year] = data.expiryDate.split('/');
				const currentDate = new Date();
				const currentYear = currentDate.getFullYear() % 100;
				const currentMonth = currentDate.getMonth() + 1;

				if (parseInt(month) < 1 || parseInt(month) > 12) {
					errors.push('Month must be between 01 and 12');
					suggestions.push('Enter a valid month (01-12)');
				}

				if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
					errors.push('Card has expired');
					suggestions.push('Please use a card that has not expired');
				}
			}
		}

		// Validate CVV
		if (!data.cvv || typeof data.cvv !== 'string') {
			errors.push('CVV is required');
			suggestions.push('Please enter your 3-4 digit CVV');
		} else {
			const cleanCvv = data.cvv.replace(/\s+/g, '');
			if (cleanCvv.length < 3 || cleanCvv.length > 4) {
				errors.push('CVV must be 3-4 digits');
				suggestions.push('Enter the 3-4 digit security code on the back of your card');
			} else if (!/^\d+$/.test(cleanCvv)) {
				errors.push('CVV can only contain digits');
				suggestions.push('Remove any letters or special characters from your CVV');
			}
		}

		// Validate cardholder name if provided
		if (data.cardHolderName) {
			if (typeof data.cardHolderName !== 'string' || data.cardHolderName.trim().length < 2) {
				errors.push('Cardholder name must be at least 2 characters');
				suggestions.push('Enter the full name as it appears on your card');
			} else if (data.cardHolderName.length > 50) {
				errors.push('Cardholder name is too long');
				suggestions.push('Shorten the cardholder name to 50 characters or less');
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
			suggestion: suggestions.length > 0 ? suggestions[0] : undefined,
		};
	}
}
