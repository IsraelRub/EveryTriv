/**
 * Payment DTOs
 *
 * @module PaymentDTOs
 * @description Data Transfer Objects for payment processing
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsBoolean,
	IsEnum,
	IsIn,
	IsNumber,
	IsOptional,
	IsString,
	Matches,
	Max,
	MaxLength,
	Min,
	MinLength,
	ValidateIf,
} from 'class-validator';

import { PaymentMethod, PlanType, VALID_PAYMENT_METHODS, VALID_PLAN_TYPES } from '@shared/constants';

export class PaymentMethodDetailsDto {
	@ApiProperty({
		description: 'Payment method to use for the transaction',
		enum: VALID_PAYMENT_METHODS,
	})
	@IsEnum(PaymentMethod, {
		message: `Payment method must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`,
	})
	paymentMethod!: PaymentMethod;

	@ApiPropertyOptional({
		description: 'PayPal order ID returned from PayPal API',
	})
	@ValidateIf(dto => dto.paymentMethod === PaymentMethod.PAYPAL && dto.paypalOrderId !== undefined)
	@IsString({ message: 'PayPal order ID must be a string' })
	@MinLength(10, { message: 'PayPal order ID must be at least 10 characters long' })
	paypalOrderId?: string;

	@ApiPropertyOptional({
		description: 'PayPal payment ID returned from PayPal API',
	})
	@ValidateIf(dto => dto.paymentMethod === PaymentMethod.PAYPAL && dto.paypalPaymentId !== undefined)
	@IsString({ message: 'PayPal payment ID must be a string' })
	@MinLength(10, { message: 'PayPal payment ID must be at least 10 characters long' })
	paypalPaymentId?: string;

	@ApiPropertyOptional({
		description: 'Primary card number for manual credit payments (digits only)',
		example: '4242424242424242',
	})
	@ValidateIf(dto => dto.paymentMethod === PaymentMethod.MANUAL_CREDIT)
	@IsString({ message: 'Card number must be a string of digits' })
	@MinLength(12, { message: 'Card number must be at least 12 digits' })
	@MaxLength(19, { message: 'Card number cannot exceed 19 digits' })
	cardNumber?: string;

	@ApiPropertyOptional({
		description: 'Expiry date for manual credit payments in MM/YY format',
		example: '12/27',
	})
	@ValidateIf(dto => dto.paymentMethod === PaymentMethod.MANUAL_CREDIT)
	@IsString({ message: 'Expiry date must be a string' })
	@Matches(/^(0[1-9]|1[0-2])\/\d{2}$/, {
		message: 'Expiry date must be in MM/YY format',
	})
	expiryDate?: string;

	@ApiPropertyOptional({
		description: 'CVV code for manual credit payments',
		example: '123',
	})
	@ValidateIf(dto => dto.paymentMethod === PaymentMethod.MANUAL_CREDIT)
	@IsString({ message: 'CVV must be a string' })
	@MinLength(3, { message: 'CVV must be at least 3 digits' })
	@MaxLength(4, { message: 'CVV cannot exceed 4 digits' })
	@Matches(/^\d+$/, { message: 'CVV can only contain digits' })
	cvv?: string;

	@ApiPropertyOptional({
		description: 'Card holder name for manual credit payments',
		example: 'Alex Green',
	})
	@ValidateIf(dto => dto.paymentMethod === PaymentMethod.MANUAL_CREDIT)
	@IsString({ message: 'Card holder name must be a string' })
	@MinLength(2, { message: 'Card holder name must be at least 2 characters' })
	@MaxLength(80, { message: 'Card holder name cannot exceed 80 characters' })
	cardHolderName?: string;

	@ApiPropertyOptional({
		description: 'Postal code associated with the card for manual credit payments',
		example: '94107',
	})
	@ValidateIf(dto => dto.paymentMethod === PaymentMethod.MANUAL_CREDIT)
	@IsString({ message: 'Postal code must be a string' })
	@MaxLength(20, { message: 'Postal code cannot exceed 20 characters' })
	postalCode?: string;
}

export class CreatePaymentDto extends PaymentMethodDetailsDto {
	@ApiPropertyOptional({
		description: 'Plan type for subscription payments. Optional when providing direct amount.',
		example: 'premium',
		enum: VALID_PLAN_TYPES,
	})
	@IsOptional()
	@IsString()
	@IsIn(VALID_PLAN_TYPES, {
		message: `Plan type must be one of: ${VALID_PLAN_TYPES.join(', ')}`,
	})
	planType?: PlanType;

	@ApiPropertyOptional({
		description: 'Number of payments for the subscription (installments). Defaults to 1.',
		example: 12,
		minimum: 1,
		maximum: 24,
	})
	@IsOptional()
	@IsNumber({}, { message: 'Number of payments must be a number' })
	@Min(1, { message: 'Number of payments must be at least 1' })
	@Max(24, { message: 'Number of payments cannot exceed 24' })
	numberOfPayments?: number;

	@ApiPropertyOptional({
		description: 'User agreement to terms and conditions. Defaults to true for OAuth-based flows.',
		example: true,
	})
	@IsOptional()
	@IsBoolean({ message: 'Agreement to terms must be a boolean value' })
	agreeToTerms?: boolean;

	@ApiPropertyOptional({
		description: 'One-time payment amount (when not using predefined plans)',
		example: 29.99,
		minimum: 0.5,
	})
	@IsOptional()
	@IsNumber({}, { message: 'Amount must be a number' })
	@Min(0.5, { message: 'Amount must be at least 0.5' })
	amount?: number;

	@ApiPropertyOptional({
		description: 'Payment currency code (defaults to USD)',
		example: 'USD',
	})
	@IsOptional()
	@IsString()
	@MaxLength(10, { message: 'Currency code cannot exceed 10 characters' })
	currency?: string;

	@ApiPropertyOptional({
		description: 'Payment description for transaction record',
		example: 'Premium subscription',
	})
	@IsOptional()
	@IsString()
	@MaxLength(200, { message: 'Description cannot exceed 200 characters' })
	description?: string;

	@ApiPropertyOptional({
		description: 'Additional payment information',
		example: 'Additional payment information',
	})
	@IsOptional()
	@IsString()
	@MaxLength(500, { message: 'Additional info cannot exceed 500 characters' })
	additionalInfo?: string;
}
