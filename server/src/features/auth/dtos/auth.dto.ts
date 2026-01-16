import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
	@ApiProperty({
		description: 'Email for login',
		example: 'user@example.com',
	})
	@IsEmail({}, { message: 'Please provide a valid email address' })
	@IsNotEmpty({ message: 'Email is required' })
	@MaxLength(255, { message: 'Email cannot exceed 255 characters' })
	email: string;

	@ApiProperty({
		description: 'User password',
		minLength: 6,
		maxLength: 15,
	})
	@IsString()
	@IsNotEmpty({ message: 'Password is required' })
	@MinLength(6, { message: 'Password must be at least 6 characters long' })
	@MaxLength(15, { message: 'Password cannot exceed 15 characters' })
	password: string;
}

export class RegisterDto {
	@ApiProperty({
		description: 'Valid email address',
		example: 'user@your-domain.com',
	})
	@IsEmail({}, { message: 'Please provide a valid email address' })
	@IsNotEmpty({ message: 'Email is required' })
	@MaxLength(255, { message: 'Email cannot exceed 255 characters' })
	email: string;

	@ApiProperty({
		description: 'Secure password',
		minLength: 6,
		maxLength: 15,
	})
	@IsString()
	@IsNotEmpty({ message: 'Password is required' })
	@MinLength(6, { message: 'Password must be at least 6 characters long' })
	@MaxLength(15, { message: 'Password cannot exceed 15 characters' })
	password: string;

	@ApiPropertyOptional({
		description: 'First name',
		maxLength: 50,
	})
	@IsOptional()
	@IsString()
	@MaxLength(50, { message: 'First name cannot exceed 50 characters' })
	@Matches(/^[a-zA-Z\s'-]+$/, {
		message: 'First name can only contain letters, spaces, apostrophes, and hyphens',
	})
	firstName?: string;

	@ApiPropertyOptional({
		description: 'Last name',
		maxLength: 50,
	})
	@IsOptional()
	@IsString()
	@MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
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
