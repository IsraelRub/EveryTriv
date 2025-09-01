/**
 * Storage Controller
 *
 * @module storage.controller
 * @description Controller for storage service management and monitoring
 */
import { Controller, Delete, Get, HttpException, HttpStatus, Param, Post } from '@nestjs/common';

import { ServerStorageService } from './storage.service';

@Controller('storage')
export class StorageController {
	constructor(private readonly storageService: ServerStorageService) {}

	/**
	 * Get storage service metrics
	 * @returns Storage metrics
	 */
	@Get('metrics')
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
					message: error instanceof Error ? error.message : 'Unknown error',
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
					message: error instanceof Error ? error.message : 'Unknown error',
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
	async getKeys() {
		try {
			const result = await this.storageService.getKeys();
			if (!result.success) {
				throw new Error(result.error || 'Failed to get keys');
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
					message: error instanceof Error ? error.message : 'Unknown error',
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
	async getItem(@Param('key') key: string) {
		try {
			const result = await this.storageService.getItem(key);
			if (!result.success) {
				throw new Error(result.error || 'Failed to get item');
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
					message: error instanceof Error ? error.message : 'Unknown error',
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
	async clear() {
		try {
			const result = await this.storageService.clear();
			if (!result.success) {
				throw new Error(result.error || 'Failed to clear storage');
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
					message: error instanceof Error ? error.message : 'Unknown error',
				},
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}
}
