import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { ErrorCode, LengthKey, PaymentMethod, VALIDATION_LENGTH } from '@shared/constants';
import type { ValidationResult } from '@shared/types';
import { calculateDuration, isNonEmptyString, isRecord, sanitizeCardNumber } from '@shared/utils';
import {
	isPaymentMethod,
	isValidCardNumber,
	validateCVV,
	validateExpiryDate,
	validateStringLength,
	VALIDATORS,
} from '@shared/validation';

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
			throw new BadRequestException(ErrorCode.CARD_DETAILS_REQUIRED);
		}

		if (!this.isManualPaymentPayload(value)) {
			throw new BadRequestException(ErrorCode.INCOMPLETE_PAYMENT_INFO);
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
		if (!data.cardNumber || !VALIDATORS.string(data.cardNumber)) {
			errors.push('Card number is required');
			suggestions.push('Please enter your card number');
		} else {
			const sanitizedCardNumber = sanitizeCardNumber(data.cardNumber);
			const lengthResult = validateStringLength(sanitizedCardNumber, LengthKey.CARD_NUMBER);
			if (!lengthResult.isValid) {
				errors.push(...lengthResult.errors);
				suggestions.push('Enter a valid card number (12-19 digits)');
			} else if (!isValidCardNumber(sanitizedCardNumber)) {
				errors.push('Card number must pass Luhn algorithm validation');
				suggestions.push('Enter a valid card number');
			}
		}

		// Validate expiry date using shared validation function
		if (!data.expiryDate || !VALIDATORS.string(data.expiryDate)) {
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
		if (!data.cvv || !VALIDATORS.string(data.cvv)) {
			errors.push('CVV is required');
			suggestions.push('Please enter your 3-4 digit CVV');
		} else {
			const lengthResult = validateStringLength(data.cvv, LengthKey.CVV);
			if (!lengthResult.isValid) {
				errors.push(...lengthResult.errors);
				suggestions.push('CVV must be 3 or 4 digits');
			} else {
				const cvvValidation = validateCVV(data.cvv);
				if (!cvvValidation.isValid) {
					errors.push(...cvvValidation.errors);
					if (cvvValidation.suggestion) {
						suggestions.push(cvvValidation.suggestion);
					}
				}
			}
		}

		// Validate cardholder name if provided using shared validation function
		if (data.cardHolderName) {
			const nameValidation = validateStringLength(data.cardHolderName, LengthKey.CARDHOLDER_NAME);
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
			(!VALIDATORS.string(value.paypalOrderId) || value.paypalOrderId.trim().length < VALIDATION_LENGTH.ORDER_ID.MIN) &&
			(!VALIDATORS.string(value.paypalPaymentId) ||
				value.paypalPaymentId.trim().length < VALIDATION_LENGTH.ORDER_ID.MIN)
		) {
			throw new BadRequestException(ErrorCode.PAYPAL_ORDER_ID_REQUIRED);
		}
	}

	private hasPayPalOrderId(value: PersonalPaymentData | CreatePaymentDto): boolean {
		return isNonEmptyString(value.paypalOrderId) || isNonEmptyString(value.paypalPaymentId);
	}

	private getPaymentMethod(value: PersonalPaymentData | CreatePaymentDto): PaymentMethod {
		if ('paymentMethod' in value && value.paymentMethod) {
			const method = value.paymentMethod;
			if (VALIDATORS.string(method) && isPaymentMethod(method)) {
				return method;
			}
		}
		return PaymentMethod.MANUAL_CREDIT;
	}

	private hasCardData(value: PersonalPaymentData | CreatePaymentDto): boolean {
		const hasCardNumber = 'cardNumber' in value && isNonEmptyString(value.cardNumber);
		const hasCvv = 'cvv' in value && isNonEmptyString(value.cvv);
		return hasCardNumber || hasCvv;
	}

	private isManualPaymentPayload(value: PersonalPaymentData | CreatePaymentDto): value is PersonalPaymentData {
		if (!('cardNumber' in value) || !('cvv' in value)) {
			return false;
		}

		return isNonEmptyString(value.cardNumber) && isNonEmptyString(value.cvv);
	}

	private sanitizeManualPaymentValue<T extends PersonalPaymentData | CreatePaymentDto>(value: T): T {
		if ('cardNumber' in value && VALIDATORS.string(value.cardNumber)) {
			value.cardNumber = value.cardNumber.replace(/\s+/g, '');
		}

		if ('cvv' in value && VALIDATORS.string(value.cvv)) {
			value.cvv = value.cvv.trim();
		}

		if ('expiryDate' in value && VALIDATORS.string(value.expiryDate)) {
			value.expiryDate = value.expiryDate.trim();
		}

		return value;
	}
}
