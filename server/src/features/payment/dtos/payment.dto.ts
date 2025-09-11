/**
 * Payment DTOs
 *
 * @module PaymentDTOs
 * @description Data Transfer Objects for payment processing
 */
import { 
	IsString, 
	IsNumber, 
	IsOptional, 
	IsNotEmpty,
	MaxLength,
	IsIn,
	Min,
	Max,
	IsBoolean
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
	@ApiProperty({
		description: 'Plan type for subscription',
		example: 'premium',
		enum: ['basic', 'premium', 'pro']
	})
	@IsString()
	@IsNotEmpty({ message: 'Plan type is required' })
	@IsIn(['basic', 'premium', 'pro'], { 
		message: 'Plan type must be one of: basic, premium, pro' 
	})
	planType: 'basic' | 'premium' | 'pro';

	@ApiProperty({
		description: 'Number of payments for the subscription',
		example: 12,
		minimum: 1,
		maximum: 24
	})
	@IsNumber({}, { message: 'Number of payments must be a number' })
	@Min(1, { message: 'Number of payments must be at least 1' })
	@Max(24, { message: 'Number of payments cannot exceed 24' })
	numberOfPayments: number;

	@ApiProperty({
		description: 'User agreement to terms and conditions',
		example: true
	})
	@IsBoolean({ message: 'Agreement to terms must be a boolean value' })
	agreeToTerms: boolean;

	@ApiPropertyOptional({
		description: 'Additional payment information',
		example: 'Additional payment information'
	})
	@IsOptional()
	@IsString()
	@MaxLength(500, { message: 'Additional info cannot exceed 500 characters' })
	additionalInfo?: string;
}

export class PaymentHistoryQueryDto {
	@ApiPropertyOptional({
		description: 'Maximum number of payments to return',
		example: 20,
		minimum: 1,
		maximum: 100
	})
	@IsOptional()
	@IsNumber({}, { message: 'Limit must be a number' })
	@Min(1, { message: 'Limit must be at least 1' })
	@Max(100, { message: 'Limit cannot exceed 100' })
	limit?: number = 20;

	@ApiPropertyOptional({
		description: 'Filter by payment status',
		example: 'succeeded',
		enum: ['succeeded', 'pending', 'failed', 'cancelled']
	})
	@IsOptional()
	@IsString()
	@IsIn(['succeeded', 'pending', 'failed', 'cancelled'], { 
		message: 'Status must be one of: succeeded, pending, failed, cancelled' 
	})
	status?: string;

	@ApiPropertyOptional({
		description: 'Filter by plan type',
		example: 'premium',
		enum: ['basic', 'premium', 'pro']
	})
	@IsOptional()
	@IsString()
	@IsIn(['basic', 'premium', 'pro'], { 
		message: 'Plan type must be one of: basic, premium, pro' 
	})
	planType?: string;
}

export class ProcessPaymentDto {
	@ApiProperty({
		description: 'Payment amount in cents',
		example: 2999,
		minimum: 1
	})
	@IsNumber({}, { message: 'Amount must be a number' })
	@Min(1, { message: 'Amount must be greater than 0' })
	amount: number;

	@ApiProperty({
		description: 'Currency code',
		example: 'USD',
		enum: ['USD', 'EUR', 'GBP', 'ILS']
	})
	@IsString()
	@IsNotEmpty({ message: 'Currency is required' })
	@IsIn(['USD', 'EUR', 'GBP', 'ILS'], { 
		message: 'Currency must be one of: USD, EUR, GBP, ILS' 
	})
	currency: string;

	@ApiProperty({
		description: 'Payment description',
		example: 'Subscription description',
		maxLength: 200
	})
	@IsString()
	@IsNotEmpty({ message: 'Description is required' })
	@MaxLength(200, { message: 'Description cannot exceed 200 characters' })
	description: string;

	@ApiPropertyOptional({
		description: 'Plan type',
		example: 'premium'
	})
	@IsOptional()
	@IsString()
	planType?: string;

	@ApiPropertyOptional({
		description: 'Number of payments',
		example: 12
	})
	@IsOptional()
	@IsNumber({}, { message: 'Number of payments must be a number' })
	numberOfPayments?: number;

	@ApiPropertyOptional({
		description: 'Payment type',
		example: 'subscription',
		enum: ['subscription', 'points_purchase', 'one_time']
	})
	@IsOptional()
	@IsString()
	@IsIn(['subscription', 'points_purchase', 'one_time'], { 
		message: 'Type must be one of: subscription, points_purchase, one_time' 
	})
	type?: string;
}

export class PaymentWebhookDto {
	@ApiProperty({
		description: 'Webhook event type',
		example: 'payment.succeeded'
	})
	@IsString()
	@IsNotEmpty({ message: 'Event type is required' })
	eventType: string;

	@ApiProperty({
		description: 'Webhook payload data'
	})
	@IsNotEmpty({ message: 'Payload is required' })
	payload: Record<string, unknown>;

	@ApiProperty({
		description: 'Webhook signature for verification',
		example: 'whsec_your_webhook_secret'
	})
	@IsString()
	@IsNotEmpty({ message: 'Signature is required' })
	signature: string;
}
