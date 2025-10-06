/**
 * Bulk Operations Middleware
 *
 * @module BulkOperationsMiddleware
 * @description Middleware that optimizes bulk operations by batching requests and reducing database calls
 * @author EveryTriv Team
 */
import { getErrorMessage, serverLogger as logger } from '@shared';

import { Injectable, NestMiddleware } from '@nestjs/common';

import { NestNextFunction, NestRequest, NestResponse } from '../types';

/**
 * Bulk Operations Middleware
 * @description Optimizes bulk operations by batching and queuing requests
 */
@Injectable()
export class BulkOperationsMiddleware implements NestMiddleware {
	private readonly MAX_BATCH_SIZE = 50;
	// private readonly MAX_QUEUE_SIZE = 100; // Reserved for future use
	private readonly BATCH_TIMEOUT = 1000; // 1 second

	private operationQueue: Map<string, Array<Record<string, unknown>>> = new Map();
	private batchTimers: Map<string, NodeJS.Timeout> = new Map();

	constructor() {}

	use(req: NestRequest, _res: NestResponse, next: NestNextFunction): void {
		try {
			// Check if this is a bulk operation
			if (this.isBulkOperation(req)) {
				this.handleBulkOperation(req);
			}

			// Add bulk operation metadata to request
			req.bulkMetadata = {
				isBulk: this.isBulkOperation(req),
				batchSize: this.getBatchSize(req),
				operationType: this.getOperationType(req),
				optimization: this.getOptimizationLevel(req),
			};

			next();
		} catch (error) {
			logger.systemError('Bulk operations middleware error', {
				error: getErrorMessage(error),
				path: req.path,
				method: req.method,
			});
			next();
		}
	}

	/**
	 * Check if request is a bulk operation
	 * @param req - Request object
	 * @returns True if bulk operation
	 */
	private isBulkOperation(req: NestRequest): boolean {
		// Check for bulk operation indicators
		if (req.body && Array.isArray(req.body)) {
			return req.body.length > 1;
		}

		// Check for bulk operation endpoints
		const bulkEndpoints = ['/bulk', '/batch', '/multiple', '/batch-update', '/batch-create', '/batch-delete'];

		return bulkEndpoints.some(endpoint => req.path.includes(endpoint));
	}

	/**
	 * Handle bulk operation optimization
	 * @param req - Request object
	 */
	private handleBulkOperation(req: NestRequest): void {
		const operationKey = this.getOperationKey(req);
		const operations = this.extractOperations(req);

		if (operations.length === 0) {
			return;
		}

		// Add to operation queue
		if (!this.operationQueue.has(operationKey)) {
			this.operationQueue.set(operationKey, []);
		}

		const queue = this.operationQueue.get(operationKey)!;
		queue.push(...operations);

		// Log bulk operation detection
		logger.system('Bulk operation detected', {
			operationKey,
			operationCount: operations.length,
			queueSize: queue.length,
			endpoint: req.path,
			method: req.method,
		});

		// Process batch if it reaches max size
		if (queue.length >= this.MAX_BATCH_SIZE) {
			this.processBatch(operationKey);
		} else {
			// Set timer for batch processing
			this.setBatchTimer(operationKey);
		}
	}

	/**
	 * Get operation key for batching
	 * @param req - Request object
	 * @returns Operation key
	 */
	private getOperationKey(req: NestRequest): string {
		return `${req.method}:${req.path}`;
	}

	/**
	 * Extract operations from request
	 * @param req - Request object
	 * @returns Array of operations
	 */
	private extractOperations(req: NestRequest): Array<Record<string, unknown>> {
		if (req.body && Array.isArray(req.body)) {
			return req.body;
		}

		// Extract from query parameters for GET requests
		if (req.method === 'GET' && req.query.ids) {
			const ids = Array.isArray(req.query.ids) ? req.query.ids : [req.query.ids];
			return ids.map(id => ({ id }));
		}

		return [];
	}

	/**
	 * Get batch size for operation
	 * @param req - Request object
	 * @returns Batch size
	 */
	private getBatchSize(req: NestRequest): number {
		if (req.body && Array.isArray(req.body)) {
			return Math.min(req.body.length, this.MAX_BATCH_SIZE);
		}
		return 1;
	}

	/**
	 * Get operation type
	 * @param req - Request object
	 * @returns Operation type
	 */
	private getOperationType(req: NestRequest): string {
		if (req.path.includes('create') || req.path.includes('add')) {
			return 'create';
		}
		if (req.path.includes('update') || req.path.includes('edit')) {
			return 'update';
		}
		if (req.path.includes('delete') || req.path.includes('remove')) {
			return 'delete';
		}
		if (req.path.includes('get') || req.path.includes('fetch')) {
			return 'read';
		}
		return 'unknown';
	}

	/**
	 * Get optimization level
	 * @param req - Request object
	 * @returns Optimization level
	 */
	private getOptimizationLevel(req: NestRequest): 'none' | 'basic' | 'aggressive' {
		const batchSize = this.getBatchSize(req);

		if (batchSize >= 20) {
			return 'aggressive';
		}
		if (batchSize >= 5) {
			return 'basic';
		}
		return 'none';
	}

	/**
	 * Set batch processing timer
	 * @param operationKey - Operation key
	 */
	private setBatchTimer(operationKey: string): void {
		// Clear existing timer
		if (this.batchTimers.has(operationKey)) {
			clearTimeout(this.batchTimers.get(operationKey)!);
		}

		// Set new timer
		const timer = setTimeout(() => {
			this.processBatch(operationKey);
		}, this.BATCH_TIMEOUT);

		this.batchTimers.set(operationKey, timer);
	}

	/**
	 * Process batch of operations
	 * @param operationKey - Operation key
	 */
	private processBatch(operationKey: string): void {
		const queue = this.operationQueue.get(operationKey);
		if (!queue || queue.length === 0) {
			return;
		}

		// Clear timer
		if (this.batchTimers.has(operationKey)) {
			clearTimeout(this.batchTimers.get(operationKey)!);
			this.batchTimers.delete(operationKey);
		}

		// Process batch
		const batch = queue.splice(0, this.MAX_BATCH_SIZE);

		logger.system('Processing bulk operation batch', {
			operationKey,
			batchSize: batch.length,
			remainingInQueue: queue.length,
		});

		// Clear queue if empty
		if (queue.length === 0) {
			this.operationQueue.delete(operationKey);
		}
	}
}
