import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiRequestBody } from 'everytriv-shared/types';

import { LoggerService } from '../../controllers';

/**
 * HTTP client service for making HTTP requests
 * Provides a wrapper around axios with logging and error handling
 */
@Injectable()
export class ServerHttpClient {
	private httpClient: AxiosInstance;

	constructor(private readonly logger: LoggerService) {
		this.httpClient = axios.create({
			timeout: 10000,
			headers: {
				'Content-Type': 'application/json',
			},
		});

		// Add request interceptor for logging
		this.httpClient.interceptors.request.use(
			config => {
				this.logger.logHttpRequest(config.method?.toUpperCase() || 'GET', config.url || 'unknown', 0, 0);
				return config;
			},
			error => {
				this.logger.httpServerError('HTTP Request Error', {
					error: error.message,
				});
				return Promise.reject(error);
			}
		);

		// Add response interceptor for logging
		this.httpClient.interceptors.response.use(
			response => {
				this.logger.logHttpResponse(
					response.config.method?.toUpperCase() || 'GET',
					response.config.url || 'unknown',
					response.status,
					0
				);
				return response;
			},
			error => {
				this.logger.httpServerError('HTTP Response Error', {
					status: error.response?.status,
					url: error.config?.url,
					error: error.message,
				});
				return Promise.reject(error);
			}
		);
	}

	/**
	 * Make a GET request
	 * @param url Request URL
	 * @param config Request configuration
	 * @returns Promise with response data
	 */
	async get<T = ApiRequestBody>(url: string, config?: AxiosRequestConfig): Promise<T> {
		try {
			const response: AxiosResponse<T> = await this.httpClient.get(url, config);
			return response.data;
		} catch (error) {
			this.logger.httpServerError('GET request failed', {
				url,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Make a POST request
	 * @param url Request URL
	 * @param data Request data
	 * @param config Request configuration
	 * @returns Promise with response data
	 */
	async post<T = ApiRequestBody>(url: string, data?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
		try {
			const response: AxiosResponse<T> = await this.httpClient.post(url, data, config);
			return response.data;
		} catch (error) {
			this.logger.httpServerError('POST request failed', {
				url,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Make a PUT request
	 * @param url Request URL
	 * @param data Request data
	 * @param config Request configuration
	 * @returns Promise with response data
	 */
	async put<T = ApiRequestBody>(url: string, data?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
		try {
			const response: AxiosResponse<T> = await this.httpClient.put(url, data, config);
			return response.data;
		} catch (error) {
			this.logger.httpServerError('PUT request failed', {
				url,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}

	/**
	 * Make a DELETE request
	 * @param url Request URL
	 * @param config Request configuration
	 * @returns Promise with response data
	 */
	async delete<T = ApiRequestBody>(url: string, config?: AxiosRequestConfig): Promise<T> {
		try {
			const response: AxiosResponse<T> = await this.httpClient.delete(url, config);
			return response.data;
		} catch (error) {
			this.logger.httpServerError('DELETE request failed', {
				url,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw error;
		}
	}
}

// Export singleton instance
export const serverHttpClient = new ServerHttpClient(new LoggerService());
