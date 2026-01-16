import { NEST_EXCEPTION_NAMES } from '../../constants';
import { ErrorResponseData } from '../infrastructure';

export type NestExceptionName = (typeof NEST_EXCEPTION_NAMES)[number];

export interface HttpError extends Error {
	code?: 'ECONNABORTED' | 'ENOTFOUND' | 'ECONNREFUSED' | 'ECONNRESET' | 'ETIMEDOUT' | string;

	response?: {
		status?: number;

		statusText?: string;

		data?: ErrorResponseData;
	};

	config?: {
		url?: string;

		method?: string;

		timeout?: number;
	};
}

export interface ProviderAuthError extends Error {
	statusCode?: number;

	isAuthError: true;

	provider?: string;
}

export interface ProviderRateLimitError extends Error {
	statusCode?: number;

	isRateLimitError: true;

	retryAfter?: number;

	provider?: string;
}

export interface ProviderErrorWithStatusCode extends Error {
	statusCode: number;
}
