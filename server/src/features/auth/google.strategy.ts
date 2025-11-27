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
		const clientID = process.env.GOOGLE_CLIENT_ID || '';
		const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
		const callbackURL = `${process.env.SERVER_URL || LOCALHOST_URLS.SERVER}/auth/google/callback`;

		// Validate OAuth credentials
		if (!clientID || !clientSecret) {
			logger.systemError('Google OAuth credentials are missing', {
				data: {
					hasClientID: !!clientID,
					hasClientSecret: !!clientSecret,
					callbackURL,
				},
			});
		} else if (
			clientID === 'your-google-client-id.apps.googleusercontent.com' ||
			clientSecret === 'GOCSPX-your-google-client-secret'
		) {
			logger.systemInfo('Google OAuth credentials appear to be placeholder values', {
				url: callbackURL,
			});
		} else {
			logger.systemInfo('Google OAuth strategy initialized', {
				clientId: clientID.substring(0, 20) + '...',
				url: callbackURL,
			});
		}

		super({
			clientID,
			clientSecret,
			callbackURL,
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
				firstName: profile.name?.givenName,
				lastName: profile.name?.familyName,
				avatar: profile.photos?.[0]?.value,
			};

			// Log successful validation
			logger.logAuthenticationEnhanced('login', 'google_user', profile.id, {
				email: profile.emails?.[0]?.value || '',
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
