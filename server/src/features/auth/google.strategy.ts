import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';

import { AuthenticationEvent, ERROR_CODES, LogLevel } from '@shared/constants';
import { getErrorMessage, isRecord } from '@shared/utils';

import { serverLogger as logger } from '@internal/services';

import { LOCALHOST_CONFIG } from '../../config/localhost.config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
	constructor() {
		const clientID = process.env.GOOGLE_CLIENT_ID ?? '';
		const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
		const callbackURL = `${process.env.SERVER_URL ?? LOCALHOST_CONFIG.urls.SERVER}/auth/google/callback`;

		// Validate OAuth credentials
		if (!clientID || !clientSecret) {
			logger.systemError('Google OAuth credentials are missing', {
				data: {
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

		// Create custom authorization URL with prompt=select_account parameter
		// This forces Google to show account selection screen every time
		const authorizationURL =
			'https://accounts.google.com/o/oauth2/v2/auth?' +
			`client_id=${encodeURIComponent(clientID)}&` +
			`redirect_uri=${encodeURIComponent(callbackURL)}&` +
			`response_type=code&` +
			`scope=${encodeURIComponent('email profile')}&` +
			`prompt=select_account`;

		super({
			clientID,
			clientSecret,
			callbackURL,
			scope: ['email', 'profile'],
			authorizationURL,
		});
	}

	private isProfile(value: unknown): value is Profile {
		if (!isRecord(value)) {
			return false;
		}
		return typeof value.id === 'string';
	}

	private parseProfile(value: unknown): Profile {
		if (Buffer.isBuffer(value)) {
			logger.systemError('Google OAuth profile received as Buffer - attempting to parse', {
				data: {
					valueLength: value.length,
				},
			});
			try {
				const parsed = JSON.parse(value.toString('utf8'));
				if (this.isProfile(parsed)) {
					return parsed;
				}
				throw new Error(ERROR_CODES.PARSED_BUFFER_NOT_VALID_PROFILE);
			} catch (parseError) {
				logger.systemError('Failed to parse profile Buffer as JSON', {
					errorInfo: { message: getErrorMessage(parseError) },
				});
				throw new Error(ERROR_CODES.GOOGLE_PROFILE_INVALID_FORMAT_BUFFER);
			}
		}

		if (typeof value === 'string') {
			logger.systemError('Google OAuth profile received as string - attempting to parse', {
				data: {
					valueLength: value.length,
				},
			});
			try {
				const parsed = JSON.parse(value);
				if (this.isProfile(parsed)) {
					return parsed;
				}
				throw new Error(ERROR_CODES.PARSED_STRING_NOT_VALID_PROFILE);
			} catch (parseError) {
				logger.systemError('Failed to parse profile string as JSON', {
					errorInfo: { message: getErrorMessage(parseError) },
				});
				throw new Error(ERROR_CODES.GOOGLE_PROFILE_INVALID_FORMAT_STRING);
			}
		}

		if (this.isProfile(value)) {
			return value;
		}

		throw new Error(ERROR_CODES.GOOGLE_PROFILE_INVALID_FORMAT);
	}

	async validate(accessToken: string, refreshToken: string, profile: Profile) {
		try {
			// Log all parameters for debugging
			logger.systemInfo('Google OAuth validate called', {
				data: {
					accessTokenLength: accessToken ? String(accessToken).length : 0,
					refreshTokenLength: refreshToken ? String(refreshToken).length : 0,
				},
			});

			// Parse profile if needed (handle Buffer/string cases)
			const actualProfile = this.parseProfile(profile);

			// Log profile details for debugging
			// Profile from passport-google-oauth20 may have displayName property
			const profileDisplayName =
				'displayName' in actualProfile && typeof actualProfile.displayName === 'string'
					? actualProfile.displayName
					: undefined;
			logger.systemInfo('Google OAuth profile received', {
				id: actualProfile.id,
				data: {
					emailsCount: actualProfile.emails?.length ?? 0,
					nameGivenName: actualProfile.name?.givenName,
					nameFamilyName: actualProfile.name?.familyName,
					displayName: profileDisplayName,
					photosCount: actualProfile.photos?.length ?? 0,
					profileKeys: Object.keys(actualProfile),
				},
			});

			// Validate that profile.id exists
			if (!actualProfile.id) {
				logger.logSecurityEventEnhanced('Google OAuth profile missing ID', LogLevel.ERROR, {
					errorInfo: { message: ERROR_CODES.PROFILE_ID_MISSING },
					provider: 'google',
					context: 'GoogleStrategy',
					data: {
						profileKeys: Object.keys(actualProfile),
					},
				});
				throw new Error(ERROR_CODES.GOOGLE_PROFILE_ID_MISSING);
			}

			// Use enhanced logging
			logger.logAuthenticationEnhanced(AuthenticationEvent.LOGIN, 'google_user', actualProfile.id, {
				emails: { current: actualProfile.emails?.[0]?.value ?? '' },
				provider: 'google',
				context: 'GoogleStrategy',
			});

			// Extract name from Google profile
			// Google may provide name in different formats:
			// 1. name.givenName and name.familyName (preferred)
			// 2. displayName (full name as string)
			let firstName = actualProfile.name?.givenName;
			let lastName = actualProfile.name?.familyName;

			// If name is not split, try to parse from displayName
			if (!firstName && !lastName) {
				const displayName =
					'displayName' in actualProfile && typeof actualProfile.displayName === 'string'
						? actualProfile.displayName
						: undefined;
				if (displayName) {
					const nameParts = displayName.trim().split(/\s+/);
					if (nameParts.length > 0) {
						firstName = nameParts[0];
						if (nameParts.length > 1) {
							lastName = nameParts.slice(1).join(' ');
						}
					}
				}
			}

			const user = {
				googleId: actualProfile.id,
				email: actualProfile.emails?.[0]?.value ?? '',
				firstName: firstName ?? undefined,
				lastName: lastName ?? undefined,
				avatar: actualProfile.photos?.[0]?.value,
			};

			// Log the user object being returned
			logger.systemInfo('Google OAuth validate returning user', {
				googleId: user.googleId,
				emails: { current: user.email },
				data: {
					googleIdLength: user.googleId ? String(user.googleId).length : 0,
					profileId: actualProfile.id,
				},
			});

			return user;
		} catch (error) {
			// Use enhanced security logging
			let profileId = 'unknown';
			try {
				const parsed = this.parseProfile(profile);
				profileId = parsed.id ?? 'unknown';
			} catch {
				// Profile parsing failed, use 'unknown'
			}

			logger.logSecurityEventEnhanced('Google OAuth validation failed', LogLevel.ERROR, {
				errorInfo: { message: getErrorMessage(error) },
				id: profileId,
				provider: 'google',
				context: 'GoogleStrategy',
			});
			throw error;
		}
	}
}
