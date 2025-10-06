import { getErrorMessage, serverLogger as logger } from '@shared';
import { NestNextFunction, NestRequest, NestResponse } from 'src/internal/types';

import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class CountryCheckMiddleware implements NestMiddleware {
	private readonly BLOCKED_COUNTRIES = ['XX', 'YY']; // Add blocked country codes
	private readonly RESTRICTED_ROUTES = ['/admin', '/payment']; // Routes that need country check

	constructor() {}

	use(req: NestRequest, _res: NestResponse, next: NestNextFunction) {
		try {
			// Get country from request headers or IP
			const country = this.getCountryFromRequest(req);

			// Set country in request object for controllers to use
			req.country = country;

			// Check if route needs country validation
			const needsCountryCheck = this.RESTRICTED_ROUTES.some(route => req.path?.startsWith(route) || false);

			if (needsCountryCheck) {
				// Check for blocked countries
				if (this.BLOCKED_COUNTRIES.includes(country)) {
					logger.securityDenied('Blocked country access attempt', {
						countryCode: country,
						ip: req.ip || 'unknown',
						path: req.path,
					});
					throw new ForbiddenException('Access not available in your country');
				}

				logger.securityLogin('Country check passed for restricted route', {
					countryCode: country,
					ip: req.ip || 'unknown',
					path: req.path,
				});
			} else {
				logger.securityLogin('Country check - public route', {
					countryCode: country,
					ip: req.ip || 'unknown',
					path: req.path,
				});
			}

			next();
		} catch (error) {
			if (error instanceof ForbiddenException) {
				throw error;
			}

			logger.securityDenied('Country check middleware error', {
				error: getErrorMessage(error),
				ip: req.ip || 'unknown',
				path: req.path,
			});

			next(); // Continue on error for non-critical middleware
		}
	}

	private getCountryFromRequest(req: NestRequest): string {
		// Priority: Header > IP-based geolocation > Default
		const headerCountry = req.headers['x-country'] as string;
		if (headerCountry) {
			return headerCountry.toUpperCase();
		}

		// IP-based geolocation (simplified)
		const ipCountry = this.getCountryFromIP(req.ip || '');
		if (ipCountry !== 'unknown') {
			return ipCountry;
		}

		return 'unknown';
	}

	private getCountryFromIP(ip: string): string {
		// In a real implementation, you would use a geolocation service
		// For now, return a simplified mapping
		if (!ip || ip === '::1' || ip.startsWith('127.')) {
			return 'local'; // Local development
		}

		// Simplified IP to country mapping (replace with real service)
		const ipRanges: Record<string, string> = {
			'192.168.': 'local',
			'10.': 'local',
			'172.': 'local',
		};

		for (const [range, country] of Object.entries(ipRanges)) {
			if (ip.startsWith(range)) {
				return country;
			}
		}

		return 'unknown';
	}
}
