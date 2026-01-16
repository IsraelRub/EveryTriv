import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AUTH_CONSTANTS } from '@shared/constants';

import { AppConfig } from '@config';

import { AuthenticationManager } from './authentication.manager';
import { JwtTokenService } from './jwt-token.service';
import { PasswordService } from './password.service';

@Module({
	imports: [
		JwtModule.register({
			secret: AppConfig.jwt.secret,
			signOptions: { expiresIn: AUTH_CONSTANTS.JWT_EXPIRATION },
		}),
	],
	providers: [PasswordService, JwtTokenService, AuthenticationManager],
	exports: [JwtModule, PasswordService, JwtTokenService, AuthenticationManager],
})
export class AuthModule {}
