import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	Min,
	MinLength,
	ValidateIf,
} from 'class-validator';

import { PaymentMethod, VALIDATION_LENGTH, VALIDATION_PAYMENT } from '@shared/constants';

const VALID_PAYMENT_METHODS = Object.values(PaymentMethod);

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
		minLength: VALIDATION_PAYMENT.ORDER_ID_MIN_LENGTH,
	})
	@ValidateIf(dto => dto.paymentMethod === PaymentMethod.PAYPAL && dto.paypalOrderId !== undefined)
	@IsString({ message: 'PayPal order ID must be a string' })
	@MinLength(VALIDATION_PAYMENT.ORDER_ID_MIN_LENGTH, {
		message: `PayPal order ID must be at least ${VALIDATION_PAYMENT.ORDER_ID_MIN_LENGTH} characters long`,
	})
	paypalOrderId?: string;

	@ApiPropertyOptional({
		description: 'PayPal payment ID returned from PayPal API',
		minLength: VALIDATION_PAYMENT.ORDER_ID_MIN_LENGTH,
	})
	@ValidateIf(dto => dto.paymentMethod === PaymentMethod.PAYPAL && dto.paypalPaymentId !== undefined)
	@IsString({ message: 'PayPal payment ID must be a string' })
	@MinLength(VALIDATION_PAYMENT.ORDER_ID_MIN_LENGTH, {
		message: `PayPal payment ID must be at least ${VALIDATION_PAYMENT.ORDER_ID_MIN_LENGTH} characters long`,
	})
	paypalPaymentId?: string;

	@ApiPropertyOptional({
		description: 'Primary card number for manual credit payments (digits only)',
		minLength: VALIDATION_PAYMENT.CARD_NUMBER.MIN,
		maxLength: VALIDATION_PAYMENT.CARD_NUMBER.MAX,
	})
	@ValidateIf(dto => dto.paymentMethod === PaymentMethod.MANUAL_CREDIT)
	@IsString({ message: 'Card number must be a string of digits' })
	@MinLength(VALIDATION_PAYMENT.CARD_NUMBER.MIN, {
		message: `Card number must be at least ${VALIDATION_PAYMENT.CARD_NUMBER.MIN} digits`,
	})
	@MaxLength(VALIDATION_PAYMENT.CARD_NUMBER.MAX, {
		message: `Card number cannot exceed ${VALIDATION_PAYMENT.CARD_NUMBER.MAX} digits`,
	})
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
		minLength: VALIDATION_PAYMENT.CVV.MIN,
		maxLength: VALIDATION_PAYMENT.CVV.MAX,
	})
	@ValidateIf(dto => dto.paymentMethod === PaymentMethod.MANUAL_CREDIT)
	@IsString({ message: 'CVV must be a string' })
	@MinLength(VALIDATION_PAYMENT.CVV.MIN, {
		message: `CVV must be at least ${VALIDATION_PAYMENT.CVV.MIN} digits`,
	})
	@MaxLength(VALIDATION_PAYMENT.CVV.MAX, {
		message: `CVV cannot exceed ${VALIDATION_PAYMENT.CVV.MAX} digits`,
	})
	@Matches(/^\d+$/, { message: 'CVV can only contain digits' })
	cvv?: string;

	@ApiPropertyOptional({
		description: 'Card holder name for manual credit payments',
		minLength: VALIDATION_PAYMENT.CARD_HOLDER_NAME.MIN,
		maxLength: VALIDATION_PAYMENT.CARD_HOLDER_NAME.MAX,
	})
	@ValidateIf(dto => dto.paymentMethod === PaymentMethod.MANUAL_CREDIT)
	@IsString({ message: 'Card holder name must be a string' })
	@MinLength(VALIDATION_PAYMENT.CARD_HOLDER_NAME.MIN, {
		message: `Card holder name must be at least ${VALIDATION_PAYMENT.CARD_HOLDER_NAME.MIN} characters`,
	})
	@MaxLength(VALIDATION_PAYMENT.CARD_HOLDER_NAME.MAX, {
		message: `Card holder name cannot exceed ${VALIDATION_PAYMENT.CARD_HOLDER_NAME.MAX} characters`,
	})
	cardHolderName?: string;

	@ApiPropertyOptional({
		description: 'Postal code associated with the card for manual credit payments',
		maxLength: VALIDATION_PAYMENT.POSTAL_CODE_MAX,
	})
	@ValidateIf(dto => dto.paymentMethod === PaymentMethod.MANUAL_CREDIT)
	@IsString({ message: 'Postal code must be a string' })
	@MaxLength(VALIDATION_PAYMENT.POSTAL_CODE_MAX, {
		message: `Postal code cannot exceed ${VALIDATION_PAYMENT.POSTAL_CODE_MAX} characters`,
	})
	postalCode?: string;
}

export class CreatePaymentDto extends PaymentMethodDetailsDto {
	@ApiPropertyOptional({
		description: 'One-time payment amount (when not using predefined plans)',
		minimum: VALIDATION_PAYMENT.AMOUNT_MIN,
	})
	@IsOptional()
	@IsNumber({}, { message: 'Amount must be a number' })
	@Min(VALIDATION_PAYMENT.AMOUNT_MIN, {
		message: `Amount must be at least ${VALIDATION_PAYMENT.AMOUNT_MIN}`,
	})
	amount?: number;

	@ApiPropertyOptional({
		description: 'Payment currency code (defaults to USD)',
		maxLength: VALIDATION_PAYMENT.CURRENCY_CODE_MAX,
	})
	@IsOptional()
	@IsString()
	@MaxLength(VALIDATION_PAYMENT.CURRENCY_CODE_MAX, {
		message: `Currency code cannot exceed ${VALIDATION_PAYMENT.CURRENCY_CODE_MAX} characters`,
	})
	currency?: string;

	@ApiPropertyOptional({
		description: 'Payment description for transaction record',
		maxLength: VALIDATION_LENGTH.REASON.MAX,
	})
	@IsOptional()
	@IsString()
	@MaxLength(VALIDATION_LENGTH.REASON.MAX, {
		message: `Description cannot exceed ${VALIDATION_LENGTH.REASON.MAX} characters`,
	})
	description?: string;

	@ApiPropertyOptional({
		description: 'Additional payment information',
		maxLength: VALIDATION_PAYMENT.ADDITIONAL_INFO_MAX,
	})
	@IsOptional()
	@IsString()
	@MaxLength(VALIDATION_PAYMENT.ADDITIONAL_INFO_MAX, {
		message: `Additional info cannot exceed ${VALIDATION_PAYMENT.ADDITIONAL_INFO_MAX} characters`,
	})
	additionalInfo?: string;
}
