/**
 * Payment DTOs
 *
 * @module PaymentDTOs
 * @description Data Transfer Objects for payment processing
 */
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { PlanType, VALID_PLAN_TYPES } from '@shared/constants';

export class CreatePaymentDto {
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
		description: 'Payment method used (e.g. credit_card, apple_pay)',
		example: 'credit_card',
	})
	@IsOptional()
	@IsString()
	@MaxLength(50, { message: 'Payment method cannot exceed 50 characters' })
	paymentMethod?: string;

	@ApiPropertyOptional({
		description: 'Additional payment information',
		example: 'Additional payment information',
	})
	@IsOptional()
	@IsString()
	@MaxLength(500, { message: 'Additional info cannot exceed 500 characters' })
	additionalInfo?: string;
}
