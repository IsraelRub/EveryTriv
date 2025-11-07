/**
 * Payment DTOs
 *
 * @module PaymentDTOs
 * @description Data Transfer Objects for payment processing
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { PlanType, VALID_PLAN_TYPES } from '@shared/constants';

export class CreatePaymentDto {
	@ApiProperty({
		description: 'Plan type for subscription',
		example: 'premium',
		enum: VALID_PLAN_TYPES,
	})
	@IsString()
	@IsNotEmpty({ message: 'Plan type is required' })
	@IsIn(VALID_PLAN_TYPES, {
		message: `Plan type must be one of: ${VALID_PLAN_TYPES.join(', ')}`,
	})
	planType: PlanType;

	@ApiProperty({
		description: 'Number of payments for the subscription',
		example: 12,
		minimum: 1,
		maximum: 24,
	})
	@IsNumber({}, { message: 'Number of payments must be a number' })
	@Min(1, { message: 'Number of payments must be at least 1' })
	@Max(24, { message: 'Number of payments cannot exceed 24' })
	numberOfPayments: number;

	@ApiProperty({
		description: 'User agreement to terms and conditions',
		example: true,
	})
	@IsBoolean({ message: 'Agreement to terms must be a boolean value' })
	agreeToTerms: boolean;

	@ApiPropertyOptional({
		description: 'Additional payment information',
		example: 'Additional payment information',
	})
	@IsOptional()
	@IsString()
	@MaxLength(500, { message: 'Additional info cannot exceed 500 characters' })
	additionalInfo?: string;
}
