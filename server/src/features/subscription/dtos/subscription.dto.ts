/**
 * Subscription DTOs
 *
 * @module SubscriptionDTOs
 * @description Data Transfer Objects for subscription management
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsBoolean,
	IsDateString,
	IsIn,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min,
	MinLength,
} from 'class-validator';

export class CreateSubscriptionDto {
	@ApiProperty({
		description: 'Plan type for subscription',
		example: 'premium',
		enum: ['basic', 'premium', 'pro'],
	})
	@IsString()
	@IsNotEmpty({ message: 'Plan type is required' })
	@IsIn(['basic', 'premium', 'pro'], {
		message: 'Plan type must be one of: basic, premium, pro',
	})
	planType: 'basic' | 'premium' | 'pro';

	@ApiProperty({
		description: 'Billing cycle',
		example: 'monthly',
		enum: ['monthly', 'yearly'],
	})
	@IsString()
	@IsNotEmpty({ message: 'Billing cycle is required' })
	@IsIn(['monthly', 'yearly'], {
		message: 'Billing cycle must be either monthly or yearly',
	})
	billingCycle: 'monthly' | 'yearly';

	@ApiProperty({
		description: 'Payment method ID',
		example: 'pm_your_payment_method_id',
		minLength: 1,
		maxLength: 100,
	})
	@IsString()
	@IsNotEmpty({ message: 'Payment method ID is required' })
	@MinLength(1, { message: 'Payment method ID must be at least 1 character long' })
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

export class UpdateSubscriptionDto {
	@ApiPropertyOptional({
		description: 'New plan type',
		example: 'pro',
		enum: ['basic', 'premium', 'pro'],
	})
	@IsOptional()
	@IsString()
	@IsIn(['basic', 'premium', 'pro'], {
		message: 'Plan type must be one of: basic, premium, pro',
	})
	planType?: 'basic' | 'premium' | 'pro';

	@ApiPropertyOptional({
		description: 'New billing cycle',
		example: 'yearly',
		enum: ['monthly', 'yearly'],
	})
	@IsOptional()
	@IsString()
	@IsIn(['monthly', 'yearly'], {
		message: 'Billing cycle must be either monthly or yearly',
	})
	billingCycle?: 'monthly' | 'yearly';

	@ApiPropertyOptional({
		description: 'Auto-renewal preference',
		example: false,
	})
	@IsOptional()
	@IsBoolean({ message: 'Auto-renewal must be a boolean value' })
	autoRenewal?: boolean;
}

export class CancelSubscriptionDto {
	@ApiPropertyOptional({
		description: 'Reason for cancellation',
		example: 'Reason for cancellation',
		maxLength: 500,
	})
	@IsOptional()
	@IsString()
	@MaxLength(500, { message: 'Cancellation reason cannot exceed 500 characters' })
	reason?: string;

	@ApiPropertyOptional({
		description: 'Cancel immediately or at end of billing period',
		example: false,
	})
	@IsOptional()
	@IsBoolean({ message: 'Immediate cancellation must be a boolean value' })
	immediate?: boolean = false;
}

export class SubscriptionHistoryQueryDto {
	@ApiPropertyOptional({
		description: 'Maximum number of subscriptions to return',
		example: 10,
		minimum: 1,
		maximum: 50,
	})
	@IsOptional()
	@IsNumber({}, { message: 'Limit must be a number' })
	@Min(1, { message: 'Limit must be at least 1' })
	@Max(50, { message: 'Limit cannot exceed 50' })
	limit?: number = 10;

	@ApiPropertyOptional({
		description: 'Filter by subscription status',
		example: 'active',
		enum: ['active', 'pending', 'cancelled', 'expired', 'past_due', 'unpaid'],
	})
	@IsOptional()
	@IsString()
	@IsIn(['active', 'pending', 'cancelled', 'expired', 'past_due', 'unpaid'], {
		message: 'Status must be one of: active, pending, cancelled, expired, past_due, unpaid',
	})
	status?: string;

	@ApiPropertyOptional({
		description: 'Filter by plan type',
		example: 'premium',
		enum: ['basic', 'premium', 'pro'],
	})
	@IsOptional()
	@IsString()
	@IsIn(['basic', 'premium', 'pro'], {
		message: 'Plan type must be one of: basic, premium, pro',
	})
	planType?: string;
}

export class ReactivateSubscriptionDto {
	@ApiPropertyOptional({
		description: 'New payment method ID for reactivation',
		example: 'pm_your_payment_method_id',
		maxLength: 100,
	})
	@IsOptional()
	@IsString()
	@MaxLength(100, { message: 'Payment method ID cannot exceed 100 characters' })
	paymentMethodId?: string;

	@ApiPropertyOptional({
		description: 'Promo code for reactivation discount',
		example: 'PROMO_CODE',
		maxLength: 20,
	})
	@IsOptional()
	@IsString()
	@MaxLength(20, { message: 'Promo code cannot exceed 20 characters' })
	promoCode?: string;
}

export class SubscriptionUsageDto {
	@ApiPropertyOptional({
		description: 'Start date for usage query',
		example: '2024-01-01',
	})
	@IsOptional()
	@IsDateString({}, { message: 'Start date must be a valid date' })
	startDate?: string;

	@ApiPropertyOptional({
		description: 'End date for usage query',
		example: '2024-01-31',
	})
	@IsOptional()
	@IsDateString({}, { message: 'End date must be a valid date' })
	endDate?: string;
}
