import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { ERROR_CODES, PaymentMethod } from '@shared/constants';
import type { ValidationResult } from '@shared/types';
import { calculateDuration, isRecord, sanitizeCardNumber } from '@shared/utils';
import { isPaymentMethod, isValidCardNumber, validateCVV, validateExpiryDate, validateName } from '@shared/validation';

import { serverLogger as logger } from '@internal/services';
import type { PersonalPaymentData } from '@internal/types';
import type { CreatePaymentDto } from '@features/payment/dtos';

@Injectable()
export class PaymentDataPipe implements PipeTransform {
	async transform(value: PersonalPaymentData | CreatePaymentDto): Promise<PersonalPaymentData | CreatePaymentDto> {
		const startTime = Date.now();

		logger.validationDebug('payment_data', '[REDACTED]', 'validation_start');

		if (!isRecord(value)) {
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
				duration: calculateDuration(startTime),
				method: paymentMethod,
			});
			return value;
		}

		if (paymentMethod !== PaymentMethod.MANUAL_CREDIT) {
			logger.validationInfo('payment_data', '[REDACTED]', 'validation_success');
			logger.apiUpdate('payment_data_validation', {
				isValid: true,
				errorsCount: 0,
				duration: calculateDuration(startTime),
				method: paymentMethod,
			});
			return value;
		}

		if (!this.hasCardData(value)) {
			throw new BadRequestException(ERROR_CODES.CARD_DETAILS_REQUIRED);
		}

		if (!this.isManualPaymentPayload(value)) {
			throw new BadRequestException(ERROR_CODES.INCOMPLETE_PAYMENT_INFO);
		}

		const validationResult = this.validateManualPaymentData(value);

		logger.apiUpdate('payment_data_validation', {
			isValid: validationResult.isValid,
			errorsCount: validationResult.errors.length,
			duration: calculateDuration(startTime),
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

		// Validate card number using shared validation function
		if (!data.cardNumber || typeof data.cardNumber !== 'string') {
			errors.push('Card number is required');
			suggestions.push('Please enter your card number');
		} else {
			const sanitizedCardNumber = sanitizeCardNumber(data.cardNumber);
			if (!isValidCardNumber(sanitizedCardNumber)) {
				errors.push('Card number must be between 12-19 digits and pass Luhn algorithm validation');
				suggestions.push('Enter a valid card number (12-19 digits)');
			}
		}

		// Validate expiry date using shared validation function
		if (!data.expiryDate || typeof data.expiryDate !== 'string') {
			errors.push('Expiry date is required');
			suggestions.push('Please enter your card expiry date');
		} else {
			const expiryValidation = validateExpiryDate(data.expiryDate);
			if (!expiryValidation.isValid) {
				errors.push(...expiryValidation.errors);
				if (expiryValidation.suggestion) {
					suggestions.push(expiryValidation.suggestion);
				}
			}
		}

		// Validate CVV using shared validation function
		if (!data.cvv || typeof data.cvv !== 'string') {
			errors.push('CVV is required');
			suggestions.push('Please enter your 3-4 digit CVV');
		} else {
			const cvvValidation = validateCVV(data.cvv);
			if (!cvvValidation.isValid) {
				errors.push(...cvvValidation.errors);
				if (cvvValidation.suggestion) {
					suggestions.push(cvvValidation.suggestion);
				}
			}
		}

		// Validate cardholder name if provided using shared validation function
		if (data.cardHolderName) {
			const nameValidation = validateName(data.cardHolderName, { fieldName: 'Cardholder name' });
			if (!nameValidation.isValid) {
				errors.push(...nameValidation.errors);
				suggestions.push('Enter the full name as it appears on your card');
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
			throw new BadRequestException(ERROR_CODES.PAYPAL_ORDER_ID_REQUIRED);
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
			const method = value.paymentMethod;
			if (typeof method === 'string' && isPaymentMethod(method)) {
				return method;
			}
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
