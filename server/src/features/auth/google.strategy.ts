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
import { getErrorMessage, isRecord } from '@shared/utils';

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

	/**
	 * Type guard to check if value is a valid Profile
	 */
	private isProfile(value: unknown): value is Profile {
		if (!isRecord(value)) {
			return false;
		}
		return typeof value.id === 'string';
	}

	/**
	 * Parse profile from Buffer or string to Profile object
	 */
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
				throw new Error('Parsed Buffer is not a valid Profile');
			} catch (parseError) {
				logger.systemError('Failed to parse profile Buffer as JSON', {
					error: getErrorMessage(parseError),
				});
				throw new Error('Google profile is in invalid format (Buffer)');
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
				throw new Error('Parsed string is not a valid Profile');
			} catch (parseError) {
				logger.systemError('Failed to parse profile string as JSON', {
					error: getErrorMessage(parseError),
				});
				throw new Error('Google profile is in invalid format (string)');
			}
		}

		if (this.isProfile(value)) {
			return value;
		}

		throw new Error('Google profile is in invalid format');
	}

	async validate(accessToken: string, refreshToken: string, profile: Profile) {
		try {
			// Log all parameters for debugging
			logger.systemInfo('Google OAuth validate called', {
				data: {
					hasAccessToken: !!accessToken,
					accessTokenType: typeof accessToken,
					accessTokenLength: accessToken ? String(accessToken).length : 0,
					hasRefreshToken: !!refreshToken,
					refreshTokenType: typeof refreshToken,
					profileType: typeof profile,
					isProfileBuffer: Buffer.isBuffer(profile),
					isProfileString: typeof profile === 'string',
					isProfileObject: typeof profile === 'object' && profile !== null && !Buffer.isBuffer(profile),
				},
			});

			// Parse profile if needed (handle Buffer/string cases)
			const actualProfile = this.parseProfile(profile);

			// Log profile details for debugging
			logger.systemInfo('Google OAuth profile received', {
				id: actualProfile.id,
				data: {
					profileIdType: typeof actualProfile.id,
					hasEmails: !!actualProfile.emails,
					emailsCount: actualProfile.emails?.length || 0,
					hasName: !!actualProfile.name,
					nameGivenName: actualProfile.name?.givenName,
					nameFamilyName: actualProfile.name?.familyName,
					displayName: (actualProfile as { displayName?: string }).displayName,
					hasPhotos: !!actualProfile.photos,
					photosCount: actualProfile.photos?.length || 0,
					profileKeys: Object.keys(actualProfile),
				},
			});

			// Validate that profile.id exists
			if (!actualProfile.id) {
				logger.logSecurityEventEnhanced('Google OAuth profile missing ID', 'error', {
					error: 'Profile ID is missing',
					provider: 'google',
					context: 'GoogleStrategy',
					data: {
						profileKeys: Object.keys(actualProfile),
					},
				});
				throw new Error('Google profile ID is missing');
			}

			// Use enhanced logging
			logger.logAuthenticationEnhanced('login', 'google_user', actualProfile.id, {
				email: actualProfile.emails?.[0]?.value || '',
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
				const displayName = (actualProfile as { displayName?: string }).displayName;
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
				email: actualProfile.emails?.[0]?.value || '',
				firstName: firstName || undefined,
				lastName: lastName || undefined,
				avatar: actualProfile.photos?.[0]?.value,
			};

			// Log the user object being returned
			logger.systemInfo('Google OAuth validate returning user', {
				googleId: user.googleId,
				email: user.email,
				hasFirstName: !!user.firstName,
				hasLastName: !!user.lastName,
				hasAvatar: !!user.avatar,
				data: {
					googleIdType: typeof user.googleId,
					googleIdLength: user.googleId ? String(user.googleId).length : 0,
					profileId: actualProfile.id,
					profileIdType: typeof actualProfile.id,
				},
			});

			// Log successful validation
			logger.logAuthenticationEnhanced('login', 'google_user', actualProfile.id, {
				email: actualProfile.emails?.[0]?.value || '',
				provider: 'google',
				context: 'GoogleStrategy',
			});

			return user;
		} catch (error) {
			// Use enhanced security logging
			let profileId = 'unknown';
			try {
				const parsed = this.parseProfile(profile);
				profileId = parsed.id || 'unknown';
			} catch {
				// Profile parsing failed, use 'unknown'
			}

			logger.logSecurityEventEnhanced('Google OAuth validation failed', 'error', {
				error: getErrorMessage(error),
				id: profileId,
				provider: 'google',
				context: 'GoogleStrategy',
			});
			throw error;
		}
	}
}
