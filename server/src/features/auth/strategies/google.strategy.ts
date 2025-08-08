import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UserService } from '../../user/services/user.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private userService: UserService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName, photos } = profile;
    
    try {
      let user = await this.userService.findByGoogleId(id);
      
      if (!user) {
        // Check if user exists with this email
        user = await this.userService.findByEmail(emails[0].value);
        
        if (user) {
          // Link Google account to existing user
          await this.userService.linkGoogleAccount(user.id, id);
        } else {
          // Create new user
          user = await this.userService.createGoogleUser({
            googleId: id,
            email: emails[0].value,
            fullName: displayName,
            username: emails[0].value.split('@')[0], // Use email prefix as username
            avatar: photos[0]?.value,
          });
        }
      }
      
      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
}
