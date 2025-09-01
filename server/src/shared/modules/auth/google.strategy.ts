import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';

import { LoggerService } from '../../controllers';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
	constructor(private readonly logger: LoggerService) {
		super({
			clientID: process.env.GOOGLE_CLIENT_ID || '',
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
			callbackURL: `${process.env.SERVER_URL || 'http://localhost:3000'}/auth/google/callback`,
			scope: ['email', 'profile'],
		});
	}

	async validate(profile: {
		id: string;
		emails?: Array<{ value: string }>;
		displayName?: string;
		photos?: Array<{ value: string }>;
	}) {
		try {
			this.logger.authDebug('Google OAuth validation', {
				profileId: profile.id,
				email: profile.emails?.[0]?.value,
				provider: 'google',
			});

			const user = {
				google_id: profile.id,
				email: profile.emails?.[0]?.value,
				username: profile.displayName || profile.emails?.[0]?.value?.split('@')[0],
				full_name: profile.displayName,
				avatar: profile.photos?.[0]?.value,
			};

			return user;
		} catch (error) {
			this.logger.authError('Google OAuth validation failed', {
				error: error instanceof Error ? error.message : 'Unknown error',
				profileId: profile.id,
				provider: 'google',
			});
			throw error;
		}
	}
}
