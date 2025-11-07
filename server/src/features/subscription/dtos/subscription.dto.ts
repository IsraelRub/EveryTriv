/**
 * Subscription DTOs
 *
 * @module SubscriptionDTOs
 * @description Data Transfer Objects for subscription management
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { BillingCycle, PlanType, VALID_BILLING_CYCLES, VALID_PLAN_TYPES } from '@shared/constants';

export class CreateSubscriptionDto {
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
		description: 'Billing cycle',
		example: 'monthly',
		enum: VALID_BILLING_CYCLES,
	})
	@IsString()
	@IsNotEmpty({ message: 'Billing cycle is required' })
	@IsIn(VALID_BILLING_CYCLES, {
		message: `Billing cycle must be one of: ${VALID_BILLING_CYCLES.join(', ')}`,
	})
	billingCycle: BillingCycle;

	@ApiProperty({
		description: 'Payment method ID',
		example: 'pm_your_payment_method_id',
		minLength: 1,
		maxLength: 100,
	})
	@IsString()
	@IsNotEmpty({ message: 'Payment method ID is required' })
	@MaxLength(100, { message: 'Payment method ID cannot exceed 100 characters' })
	paymentMethodId: string;

	@ApiPropertyOptional({
		description: 'Promo code for discount',
		example: 'DISCOUNT_CODE',
		maxLength: 20,
	})
	@IsOptional()
	@IsString()
	@MaxLength(20, { message: 'Promo code cannot exceed 20 characters' })
	promoCode?: string;

	@ApiPropertyOptional({
		description: 'Auto-renewal preference',
		example: true,
	})
	@IsOptional()
	@IsBoolean({ message: 'Auto-renewal must be a boolean value' })
	autoRenewal?: boolean = true;
}
