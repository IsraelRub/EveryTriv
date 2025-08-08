import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './services';
import { UserModule } from '../user/user.module';
import { AuthController } from './controllers';
import { AuthGuard } from './guards';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [AuthService, AuthGuard, GoogleStrategy],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
