import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { VALIDATION_LENGTH } from '@shared/constants';

export class LoginDto {
	@ApiProperty({
		description: 'Email for login',
		example: 'user@example.com',
	})
	@IsEmail({}, { message: 'Please provide a valid email address' })
	@IsNotEmpty({ message: 'Email is required' })
	@MaxLength(VALIDATION_LENGTH.EMAIL.MAX, {
		message: `Email cannot exceed ${VALIDATION_LENGTH.EMAIL.MAX} characters`,
	})
	email: string;

	@ApiProperty({
		description: 'User password',
		minLength: VALIDATION_LENGTH.PASSWORD.MIN,
		maxLength: VALIDATION_LENGTH.PASSWORD.MAX,
	})
	@IsString()
	@IsNotEmpty({ message: 'Password is required' })
	@MinLength(VALIDATION_LENGTH.PASSWORD.MIN, {
		message: `Password must be at least ${VALIDATION_LENGTH.PASSWORD.MIN} characters long`,
	})
	@MaxLength(VALIDATION_LENGTH.PASSWORD.MAX, {
		message: `Password cannot exceed ${VALIDATION_LENGTH.PASSWORD.MAX} characters`,
	})
	password: string;
}

export class RegisterDto {
	@ApiProperty({
		description: 'Valid email address',
		example: 'user@your-domain.com',
	})
	@IsEmail({}, { message: 'Please provide a valid email address' })
	@IsNotEmpty({ message: 'Email is required' })
	@MaxLength(VALIDATION_LENGTH.EMAIL.MAX, {
		message: `Email cannot exceed ${VALIDATION_LENGTH.EMAIL.MAX} characters`,
	})
	email: string;

	@ApiProperty({
		description: 'Secure password',
		minLength: VALIDATION_LENGTH.PASSWORD.MIN,
		maxLength: VALIDATION_LENGTH.PASSWORD.MAX,
	})
	@IsString()
	@IsNotEmpty({ message: 'Password is required' })
	@MinLength(VALIDATION_LENGTH.PASSWORD.MIN, {
		message: `Password must be at least ${VALIDATION_LENGTH.PASSWORD.MIN} characters long`,
	})
	@MaxLength(VALIDATION_LENGTH.PASSWORD.MAX, {
		message: `Password cannot exceed ${VALIDATION_LENGTH.PASSWORD.MAX} characters`,
	})
	password: string;

	@ApiPropertyOptional({
		description: 'First name',
		maxLength: VALIDATION_LENGTH.NAME.MAX,
	})
	@IsOptional()
	@IsString()
	@MaxLength(VALIDATION_LENGTH.NAME.MAX, {
		message: `First name cannot exceed ${VALIDATION_LENGTH.NAME.MAX} characters`,
	})
	@Matches(/^[a-zA-Z\s'-]+$/, {
		message: 'First name can only contain letters, spaces, apostrophes, and hyphens',
	})
	firstName?: string;

	@ApiPropertyOptional({
		description: 'Last name',
		maxLength: VALIDATION_LENGTH.NAME.MAX,
	})
	@IsOptional()
	@IsString()
	@MaxLength(VALIDATION_LENGTH.NAME.MAX, {
		message: `Last name cannot exceed ${VALIDATION_LENGTH.NAME.MAX} characters`,
	})
	@Matches(/^[a-zA-Z\s'-]+$/, {
		message: 'Last name can only contain letters, spaces, apostrophes, and hyphens',
	})
	lastName?: string;
}

export class AuthResponseDto {
	@ApiProperty({
		description: 'Access token',
		example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
	})
	accessToken: string;

	@ApiPropertyOptional({
		description: 'Refresh token',
		example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
	})
	refreshToken?: string;

	@ApiProperty({
		description: 'User information',
	})
	user: {
		id: string;
		email: string;
		firstName?: string;
		lastName?: string;
		avatar?: number;
		role: string;
		emailVerified?: boolean;
	};
}

export class RefreshTokenDto {
	@ApiProperty({
		description: 'JWT refresh token',
		example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
	})
	@IsString()
	@IsNotEmpty({ message: 'Refresh token is required' })
	refreshToken: string;
}

export class RefreshTokenResponseDto {
	@ApiProperty({
		description: 'New access token',
		example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
	})
	accessToken: string;
}
