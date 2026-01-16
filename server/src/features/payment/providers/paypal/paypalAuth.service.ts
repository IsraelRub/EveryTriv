import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import { SERVER_CACHE_KEYS } from '@shared/constants';

import { AppConfig } from '@config';
import { CacheService } from '@internal/modules';
import { serverLogger as logger } from '@internal/services';
import type { PayPalAccessTokenResponse } from '@internal/types';
import { createServerError } from '@internal/utils';

@Injectable()
export class PayPalAuthService {
	constructor(
		private readonly httpService: HttpService,
		private readonly cacheService: CacheService
	) {}

	async getAccessToken(): Promise<string> {
		const cachedToken = await this.getCachedToken();
		if (cachedToken) {
			return cachedToken;
		}

		return this.fetchNewToken();
	}

	private async fetchNewToken(): Promise<string> {
		const paypalConfig = AppConfig.paypal;
		const baseUrl = this.getBaseUrl(paypalConfig.environment);
		const authHeader = this.createAuthHeader(paypalConfig.clientId, paypalConfig.clientSecret);

		try {
			const response = await firstValueFrom(
				this.httpService.post<PayPalAccessTokenResponse>(
					`${baseUrl}/v1/oauth2/token`,
					'grant_type=client_credentials',
					{
						headers: {
							Authorization: authHeader,
							'Content-Type': 'application/x-www-form-urlencoded',
						},
					}
				)
			);

			const tokenData = response.data;
			const ttl = Math.max(0, tokenData.expires_in - 60);

			await this.cacheService.set(SERVER_CACHE_KEYS.PAYPAL.ACCESS_TOKEN, tokenData.access_token, ttl * 1000);

			logger.apiCreate('paypal_token_refresh', {
				expiresIn: String(tokenData.expires_in),
				ttl,
			});

			return tokenData.access_token;
		} catch (error) {
			logger.paymentFailed('unknown', 'Failed to fetch PayPal access token', {
				errorInfo: {
					message: error instanceof Error ? error.message : 'Unknown error',
				},
			});
			throw createServerError('fetch PayPal access token', error);
		}
	}

	private async getCachedToken(): Promise<string | null> {
		try {
			const cached = await this.cacheService.get<string>(
				SERVER_CACHE_KEYS.PAYPAL.ACCESS_TOKEN,
				(value): value is string => typeof value === 'string'
			);
			if (cached.success && cached.data) {
				return cached.data;
			}
			return null;
		} catch (error) {
			logger.cacheError('get PayPal access token', SERVER_CACHE_KEYS.PAYPAL.ACCESS_TOKEN, {
				errorInfo: {
					message: error instanceof Error ? error.message : 'Unknown error',
				},
			});
			return null;
		}
	}

	private createAuthHeader(clientId: string, clientSecret: string): string {
		const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
		return `Basic ${credentials}`;
	}

	private getBaseUrl(environment: string): string {
		return environment === 'production' ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';
	}
}
