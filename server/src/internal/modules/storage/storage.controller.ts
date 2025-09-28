/**
 * Storage Controller
 *
 * @module storage.controller
 * @description Controller for storage service management and monitoring
 */
import { Controller, Delete, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';

import { Cache, Public, RateLimit, Roles } from '../../../common';
import { ServerStorageService } from './storage.service';
import { getErrorMessage, createStorageError } from '@shared';

@Controller('storage')
export class StorageController {
	constructor(private readonly storageService: ServerStorageService) {}

	/**
	 * Get storage service metrics
	 * @returns Storage metrics
	 */
	@Get('metrics')
	@Public()
	@Cache(60) // Cache for 1 minute
	async getMetrics() {
		try {
			const metrics = this.storageService.getMetrics();
			return {
				success: true,
				data: metrics,
				message: 'Storage metrics retrieved successfully',
			};
		} catch (error) {
			throw new HttpException(
				{
					success: false,
					error: 'Failed to get storage metrics',
					message: getErrorMessage(error),
				},
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	/**
	 * Reset storage service metrics
	 * @returns Reset result
	 */
	@Post('metrics/reset')
	@Roles('admin', 'super-admin')
	@RateLimit(5, 60) // 5 requests per minute
	async resetMetrics() {
		try {
			this.storageService.resetMetrics();
			return {
				success: true,
				message: 'Storage metrics reset successfully',
			};
		} catch (error) {
			throw new HttpException(
				{
					success: false,
					error: 'Failed to reset storage metrics',
					message: getErrorMessage(error),
				},
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	/**
	 * Get storage keys
	 * @returns Storage keys
	 */
	@Get('keys')
	@Roles('admin', 'super-admin')
	@RateLimit(10, 60) // 10 requests per minute
	@Cache(30) // Cache for 30 seconds
	async getKeys() {
		try {
			const result = await this.storageService.getKeys();
			if (!result.success) {
				throw createStorageError('get keys', result.error);
			}

			return {
				success: true,
				data: result.data,
				message: 'Storage keys retrieved successfully',
			};
		} catch (error) {
			throw new HttpException(
				{
					success: false,
					error: 'Failed to get storage keys',
					message: getErrorMessage(error),
				},
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	/**
	 * Get storage item
	 * @param key Storage key
	 * @returns Storage item
	 */
	@Get('item/:key')
	@Roles('admin', 'super-admin')
	@RateLimit(20, 60) // 20 requests per minute
	@Cache(60) // Cache for 1 minute
	async getItem(@Param('key') key: string) {
		try {
			const result = await this.storageService.get(key);
			if (!result.success) {
				throw createStorageError('get item', result.error);
			}

			return {
				success: true,
				data: result.data,
				message: 'Storage item retrieved successfully',
			};
		} catch (error) {
			throw new HttpException(
				{
					success: false,
					error: 'Failed to get storage item',
					message: getErrorMessage(error),
				},
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	/**
	 * Clear storage
	 * @returns Clear result
	 */
	@Delete('clear')
	@Roles('super-admin')
	@RateLimit(2, 60) // 2 requests per minute - dangerous operation
	async clear() {
		try {
			const result = await this.storageService.clear();
			if (!result.success) {
				throw createStorageError('clear storage', result.error);
			}

			return {
				success: true,
				message: 'Storage cleared successfully',
			};
		} catch (error) {
			throw new HttpException(
				{
					success: false,
					error: 'Failed to clear storage',
					message: getErrorMessage(error),
				},
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}
}
