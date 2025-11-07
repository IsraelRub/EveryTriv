/**
 * Google OAuth Strategy
 *
 * @module GoogleStrategy
 * @description Google OAuth authentication strategy
 */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';

import { LOCALHOST_URLS } from '@shared/constants';
import { serverLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
	constructor() {
		super({
			clientID: process.env.GOOGLE_CLIENT_ID || '',
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
			callbackURL: `${process.env.SERVER_URL || LOCALHOST_URLS.API_BASE}/auth/google/callback`,
			scope: ['email', 'profile'],
		});
	}

	async validate(profile: Profile) {
		try {
			// Use enhanced logging
			logger.logAuthenticationEnhanced('login', 'google_user', profile.id, {
				email: profile.emails?.[0]?.value || '',
				provider: 'google',
				context: 'GoogleStrategy',
			});

			const user = {
				google_id: profile.id,
				email: profile.emails?.[0]?.value || '',
				username: profile.displayName || profile.emails?.[0]?.value?.split('@')[0] || '',
				full_name: profile.displayName,
				avatar: profile.photos?.[0]?.value,
			};

			// Log successful validation
			logger.logAuthenticationEnhanced('login', 'google_user', profile.id, {
				email: profile.emails?.[0]?.value || '',
				username: user.username,
				provider: 'google',
				context: 'GoogleStrategy',
			});

			return user;
		} catch (error) {
			// Use enhanced security logging
			logger.logSecurityEventEnhanced('Google OAuth validation failed', 'error', {
				error: getErrorMessage(error),
				id: profile.id,
				provider: 'google',
				context: 'GoogleStrategy',
			});
			throw error;
		}
	}
}
