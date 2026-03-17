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

import { AMOUNT_MIN, PaymentMethod, VALIDATION_LENGTH } from '@shared/constants';

export class PaymentMethodDetailsDto {
	@ApiProperty({
		description: 'Payment method to use for the transaction',
		enum: PaymentMethod,
	})
	@IsEnum(PaymentMethod, { message: 'Payment method must be a valid PaymentMethod value' })
	paymentMethod!: PaymentMethod;

	@ApiPropertyOptional({
		description: 'PayPal order ID returned from PayPal API',
		minLength: VALIDATION_LENGTH.ORDER_ID.MIN,
	})
	@ValidateIf(dto => dto.paymentMethod === PaymentMethod.PAYPAL && dto.paypalOrderId !== undefined)
	@IsString({ message: 'PayPal order ID must be a string' })
	@MinLength(VALIDATION_LENGTH.ORDER_ID.MIN, {
		message: `PayPal order ID must be at least ${VALIDATION_LENGTH.ORDER_ID.MIN} characters long`,
	})
	paypalOrderId?: string;

	@ApiPropertyOptional({
		description: 'PayPal payment ID returned from PayPal API',
		minLength: VALIDATION_LENGTH.ORDER_ID.MIN,
	})
	@ValidateIf(dto => dto.paymentMethod === PaymentMethod.PAYPAL && dto.paypalPaymentId !== undefined)
	@IsString({ message: 'PayPal payment ID must be a string' })
	@MinLength(VALIDATION_LENGTH.ORDER_ID.MIN, {
		message: `PayPal payment ID must be at least ${VALIDATION_LENGTH.ORDER_ID.MIN} characters long`,
	})
	paypalPaymentId?: string;

	@ApiPropertyOptional({
		description: 'Primary card number for manual credit payments (digits only)',
		minLength: VALIDATION_LENGTH.CARD_NUMBER.MIN,
		maxLength: VALIDATION_LENGTH.CARD_NUMBER.MAX,
	})
	@ValidateIf(dto => dto.paymentMethod === PaymentMethod.MANUAL_CREDIT)
	@IsString({ message: 'Card number must be a string of digits' })
	@MinLength(VALIDATION_LENGTH.CARD_NUMBER.MIN, {
		message: `Card number must be at least ${VALIDATION_LENGTH.CARD_NUMBER.MIN} digits`,
	})
	@MaxLength(VALIDATION_LENGTH.CARD_NUMBER.MAX, {
		message: `Card number cannot exceed ${VALIDATION_LENGTH.CARD_NUMBER.MAX} digits`,
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
		minLength: VALIDATION_LENGTH.CVV.MIN,
		maxLength: VALIDATION_LENGTH.CVV.MAX,
	})
	@ValidateIf(dto => dto.paymentMethod === PaymentMethod.MANUAL_CREDIT)
	@IsString({ message: 'CVV must be a string' })
	@MinLength(VALIDATION_LENGTH.CVV.MIN, {
		message: `CVV must be at least ${VALIDATION_LENGTH.CVV.MIN} digits`,
	})
	@MaxLength(VALIDATION_LENGTH.CVV.MAX, {
		message: `CVV cannot exceed ${VALIDATION_LENGTH.CVV.MAX} digits`,
	})
	@Matches(/^\d+$/, { message: 'CVV can only contain digits' })
	cvv?: string;

	@ApiPropertyOptional({
		description: 'Card holder name for manual credit payments',
		minLength: VALIDATION_LENGTH.CARDHOLDER_NAME.MIN,
		maxLength: VALIDATION_LENGTH.CARDHOLDER_NAME.MAX,
	})
	@ValidateIf(dto => dto.paymentMethod === PaymentMethod.MANUAL_CREDIT)
	@IsString({ message: 'Card holder name must be a string' })
	@MinLength(VALIDATION_LENGTH.CARDHOLDER_NAME.MIN, {
		message: `Card holder name must be at least ${VALIDATION_LENGTH.CARDHOLDER_NAME.MIN} characters`,
	})
	@MaxLength(VALIDATION_LENGTH.CARDHOLDER_NAME.MAX, {
		message: `Card holder name cannot exceed ${VALIDATION_LENGTH.CARDHOLDER_NAME.MAX} characters`,
	})
	cardHolderName?: string;

	@ApiPropertyOptional({
		description: 'Postal code associated with the card for manual credit payments',
		maxLength: VALIDATION_LENGTH.POSTAL_CODE.MAX,
	})
	@ValidateIf(dto => dto.paymentMethod === PaymentMethod.MANUAL_CREDIT)
	@IsString({ message: 'Postal code must be a string' })
	@MaxLength(VALIDATION_LENGTH.POSTAL_CODE.MAX, {
		message: `Postal code cannot exceed ${VALIDATION_LENGTH.POSTAL_CODE.MAX} characters`,
	})
	postalCode?: string;
}

export class CreatePaymentDto extends PaymentMethodDetailsDto {
	@ApiPropertyOptional({
		description: 'One-time payment amount (when not using predefined plans)',
		minimum: AMOUNT_MIN,
	})
	@IsOptional()
	@IsNumber({}, { message: 'Amount must be a number' })
	@Min(AMOUNT_MIN, {
		message: `Amount must be at least ${AMOUNT_MIN}`,
	})
	amount?: number;

	@ApiPropertyOptional({
		description: 'Payment currency code (defaults to USD)',
		maxLength: VALIDATION_LENGTH.CURRENCY_CODE.MAX,
	})
	@IsOptional()
	@IsString()
	@MaxLength(VALIDATION_LENGTH.CURRENCY_CODE.MAX, {
		message: `Currency code cannot exceed ${VALIDATION_LENGTH.CURRENCY_CODE.MAX} characters`,
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
		maxLength: VALIDATION_LENGTH.ADDITIONAL_INFO.MAX,
	})
	@IsOptional()
	@IsString()
	@MaxLength(VALIDATION_LENGTH.ADDITIONAL_INFO.MAX, {
		message: `Additional info cannot exceed ${VALIDATION_LENGTH.ADDITIONAL_INFO.MAX} characters`,
	})
	additionalInfo?: string;
}
