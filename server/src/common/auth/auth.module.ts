import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AppConfig } from '@config';

import { AuthenticationManager } from './authentication.manager';
import { JwtTokenService } from './jwtToken.service';
import { PasswordService } from './password.service';

@Module({
	imports: [
		JwtModule.register({
			secret: AppConfig.jwt.secret,
			signOptions: { expiresIn: AppConfig.jwt.expiresIn },
		}),
	],
	providers: [PasswordService, JwtTokenService, AuthenticationManager],
	exports: [JwtModule, PasswordService, JwtTokenService, AuthenticationManager],
})
export class CommonAuthModule {}
