/**
 * Auth DTOs
 *
 * @module AuthDTOs
 * @description Data Transfer Objects for authentication
 */
import { 
	IsEmail, 
	IsString, 
	MinLength, 
	IsOptional, 
	MaxLength, 
	Matches, 
	IsNotEmpty
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
	@ApiProperty({
		description: 'Username or email for login',
		example: 'username',
		minLength: 3,
		maxLength: 50
	})
	@IsString()
	@IsNotEmpty({ message: 'Username is required' })
	@MinLength(3, { message: 'Username must be at least 3 characters long' })
	@MaxLength(50, { message: 'Username cannot exceed 50 characters' })
	@Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Username can only contain letters, numbers, underscores, and hyphens' })
	username: string;

	@ApiProperty({
		description: 'User password',
		example: 'securePassword123',
		minLength: 6
	})
	@IsString()
	@IsNotEmpty({ message: 'Password is required' })
	@MinLength(6, { message: 'Password must be at least 6 characters long' })
	@MaxLength(128, { message: 'Password cannot exceed 128 characters' })
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
		message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number' 
	})
	password: string;
}

export class RegisterDto {
	@ApiProperty({
		description: 'Unique username',
		example: 'username',
		minLength: 3,
		maxLength: 50
	})
	@IsString()
	@IsNotEmpty({ message: 'Username is required' })
	@MinLength(3, { message: 'Username must be at least 3 characters long' })
	@MaxLength(50, { message: 'Username cannot exceed 50 characters' })
	@Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Username can only contain letters, numbers, underscores, and hyphens' })
	username: string;

	@ApiProperty({
		description: 'Valid email address',
		example: 'user@your-domain.com'
	})
	@IsEmail({}, { message: 'Please provide a valid email address' })
	@IsNotEmpty({ message: 'Email is required' })
	@MaxLength(255, { message: 'Email cannot exceed 255 characters' })
	email: string;

	@ApiProperty({
		description: 'Secure password',
		example: 'SecurePassword123!',
		minLength: 6
	})
	@IsString()
	@IsNotEmpty({ message: 'Password is required' })
	@MinLength(6, { message: 'Password must be at least 6 characters long' })
	@MaxLength(128, { message: 'Password cannot exceed 128 characters' })
	@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
		message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number' 
	})
	password: string;

	@ApiPropertyOptional({
		description: 'First name',
		example: 'First',
		maxLength: 50
	})
	@IsOptional()
	@IsString()
	@MaxLength(50, { message: 'First name cannot exceed 50 characters' })
	@Matches(/^[a-zA-Z\s'-]+$/, { message: 'First name can only contain letters, spaces, apostrophes, and hyphens' })
	firstName?: string;

	@ApiPropertyOptional({
		description: 'Last name',
		example: 'Last',
		maxLength: 50
	})
	@IsOptional()
	@IsString()
	@MaxLength(50, { message: 'Last name cannot exceed 50 characters' })
	@Matches(/^[a-zA-Z\s'-]+$/, { message: 'Last name can only contain letters, spaces, apostrophes, and hyphens' })
	lastName?: string;
}

export class AuthResponseDto {
	@ApiProperty({
		description: 'Indicates if the authentication was successful',
		example: true
	})
	success: boolean;

	@ApiProperty({
		description: 'Response data containing auth information'
	})
	data: {
		access_token: string;
		refresh_token?: string;
		user: {
			id: string;
			username: string;
			email: string;
			firstName?: string;
			lastName?: string;
			role: string;
		};
	};

	@ApiProperty({
		description: 'Response timestamp',
		example: '2024-01-01T00:00:00.000Z'
	})
	timestamp: string;
}

export class RefreshTokenDto {
	@ApiProperty({
		description: 'JWT refresh token',
		example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
	})
	@IsString()
	@IsNotEmpty({ message: 'Refresh token is required' })
	refreshToken: string;
}

export class RefreshTokenResponseDto {
	@ApiProperty({
		description: 'Indicates if the refresh was successful',
		example: true
	})
	success: boolean;

	@ApiProperty({
		description: 'Response data containing new access token'
	})
	data: {
		access_token: string;
	};

	@ApiProperty({
		description: 'Response timestamp',
		example: '2024-01-01T00:00:00.000Z'
	})
	timestamp: string;
}
