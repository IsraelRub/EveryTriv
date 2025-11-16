/**
 * Payment Data Validation Pipe
 *
 * @module PaymentDataPipe
 * @description Pipe for validating payment data input with comprehensive validation
 * @used_by server/src/features/payment, server/src/controllers
 */
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { PaymentMethod } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import type { PersonalPaymentData, ValidationResult } from '@shared/types';

import type { CreatePaymentDto } from '../../features/payment/dtos/payment.dto';

@Injectable()
export class PaymentDataPipe implements PipeTransform {
	async transform(value: PersonalPaymentData | CreatePaymentDto): Promise<PersonalPaymentData | CreatePaymentDto> {
		const startTime = Date.now();

		logger.validationDebug('payment_data', '[REDACTED]', 'validation_start');

		if (!this.isPlainObject(value)) {
			logger.validationWarn('payment_data', '[REDACTED]', 'validation_skipped', {
				reason: 'non_object_payload',
			});
			return value;
		}

		logger.validationDebug('payment_data_payload', JSON.stringify(Object.keys(value)), 'keys');

		const paymentMethod = this.getPaymentMethod(value);
		if (paymentMethod === PaymentMethod.PAYPAL) {
			if (this.hasPayPalOrderId(value)) {
				this.ensurePayPalOrderId(value);
			}
			logger.validationInfo('payment_data', '[REDACTED]', 'validation_success');
			logger.apiUpdate('payment_data_validation', {
				isValid: true,
				errorsCount: 0,
				duration: Date.now() - startTime,
				method: paymentMethod,
			});
			return value;
		}

		if (paymentMethod !== PaymentMethod.MANUAL_CREDIT) {
			logger.validationInfo('payment_data', '[REDACTED]', 'validation_success');
			logger.apiUpdate('payment_data_validation', {
				isValid: true,
				errorsCount: 0,
				duration: Date.now() - startTime,
				method: paymentMethod,
			});
			return value;
		}

		if (!this.hasCardData(value)) {
			throw new BadRequestException('Card details are required for manual credit payments');
		}

		if (!this.isManualPaymentPayload(value)) {
			throw new BadRequestException('Incomplete payment information supplied');
		}

		const validationResult = this.validateManualPaymentData(value);

		logger.apiUpdate('payment_data_validation', {
			isValid: validationResult.isValid,
			errorsCount: validationResult.errors.length,
			duration: Date.now() - startTime,
			method: paymentMethod,
		});

		if (!validationResult.isValid) {
			throw new BadRequestException({
				message: 'Payment data validation failed',
				errors: validationResult.errors,
				suggestion: validationResult.suggestion,
			});
		}

		logger.validationInfo('payment_data', '[REDACTED]', 'validation_success');
		return this.sanitizeManualPaymentValue(value);
	}

	private validateManualPaymentData(data: PersonalPaymentData | CreatePaymentDto): ValidationResult {
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

	private ensurePayPalOrderId(value: PersonalPaymentData | CreatePaymentDto): void {
		if (
			(typeof value.paypalOrderId !== 'string' || value.paypalOrderId.trim().length < 10) &&
			(typeof value.paypalPaymentId !== 'string' || value.paypalPaymentId.trim().length < 10)
		) {
			throw new BadRequestException('A valid PayPal order ID or payment ID is required');
		}
	}

	private hasPayPalOrderId(value: PersonalPaymentData | CreatePaymentDto): boolean {
		return (
			(typeof value.paypalOrderId === 'string' && value.paypalOrderId.trim().length > 0) ||
			(typeof value.paypalPaymentId === 'string' && value.paypalPaymentId.trim().length > 0)
		);
	}

	private getPaymentMethod(value: PersonalPaymentData | CreatePaymentDto): PaymentMethod {
		if ('paymentMethod' in value && value.paymentMethod) {
			return value.paymentMethod;
		}
		return PaymentMethod.MANUAL_CREDIT;
	}

	private hasCardData(value: PersonalPaymentData | CreatePaymentDto): boolean {
		const hasCardNumber =
			'cardNumber' in value && typeof value.cardNumber === 'string' && value.cardNumber.trim().length > 0;
		const hasCvv = 'cvv' in value && typeof value.cvv === 'string' && value.cvv.trim().length > 0;
		return hasCardNumber || hasCvv;
	}

	private isManualPaymentPayload(value: PersonalPaymentData | CreatePaymentDto): value is PersonalPaymentData {
		if (!('cardNumber' in value) || !('cvv' in value)) {
			return false;
		}

		return typeof value.cardNumber === 'string' && typeof value.cvv === 'string';
	}

	private isPlainObject(value: unknown): value is PersonalPaymentData | CreatePaymentDto {
		return typeof value === 'object' && value !== null;
	}

	private sanitizeManualPaymentValue<T extends PersonalPaymentData | CreatePaymentDto>(value: T): T {
		if ('cardNumber' in value && typeof value.cardNumber === 'string') {
			value.cardNumber = value.cardNumber.replace(/\s+/g, '');
		}

		if ('cvv' in value && typeof value.cvv === 'string') {
			value.cvv = value.cvv.trim();
		}

		if ('expiryDate' in value && typeof value.expiryDate === 'string') {
			value.expiryDate = value.expiryDate.trim();
		}

		return value;
	}
}
