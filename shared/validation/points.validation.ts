/**
 * Points-related validation utilities
 *
 * @module PointsValidation
 * @description Shared validation functions for points operations and transactions
 * @author EveryTriv Team
 */
import type { PointBalance, PointPurchaseOption, PointTransaction } from '../types';
import type { PointsValidationResult } from '../types/domain/validation/validation.types';
import { validatePaymentAmount } from './payment.validation';

/**
 * Validate point balance for operations
 * @param balance - Point balance to validate
 * @returns Validation result with errors and warnings
 */
export function validatePointBalance(balance: PointBalance): PointsValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Required fields validation
	if (typeof balance.total_points !== 'number' || balance.total_points < 0) {
		errors.push('Total points must be a non-negative number');
	}

	if (typeof balance.purchased_points !== 'number' || balance.purchased_points < 0) {
		errors.push('Purchased points must be a non-negative number');
	}

	if (typeof balance.free_questions !== 'number' || balance.free_questions < 0) {
		errors.push('Free questions must be a non-negative number');
	}

	// Business logic validation
	if (balance.purchased_points > balance.total_points) {
		errors.push('Purchased points cannot exceed total points');
	}

	if (balance.free_questions > 100) {
		warnings.push('Free questions count seems unusually high');
	}

	// Consistency checks
	const calculatedTotal = balance.purchased_points + balance.free_questions * 0.1;
	const difference = Math.abs(calculatedTotal - balance.total_points);

	if (difference > 0.1) {
		warnings.push('Point balance calculation may be inconsistent');
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Validate point purchase operation
 * @param packageToPurchase - Package being purchased
 * @param currentBalance - Current user balance
 * @param availablePackages - Available packages
 * @returns Validation result with errors and warnings
 */
export function validatePointPurchase(
	packageToPurchase: PointPurchaseOption,
	_currentBalance: PointBalance,
	availablePackages: PointPurchaseOption[]
): PointsValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Package existence validation
	const packageExists = availablePackages.some(pkg => pkg.id === packageToPurchase.id);
	if (!packageExists) {
		errors.push('Selected package is not available');
	}

	// Package data validation
	if (packageToPurchase.points <= 0) {
		errors.push('Package must contain positive points');
	}

	if (packageToPurchase.price <= 0) {
		errors.push('Package must have positive price');
	}

	if (packageToPurchase.price_per_point <= 0) {
		errors.push('Package must have positive price per point');
	}

	// Use payment validation for price validation
	const paymentValidation = validatePaymentAmount(packageToPurchase.price);
	if (!paymentValidation.isValid) {
		errors.push(...paymentValidation.errors);
	}
	if (paymentValidation.warnings) {
		warnings.push(...paymentValidation.warnings);
	}

	// Business rule validation
	if (packageToPurchase.points > 10000) {
		warnings.push('Large point packages may have usage restrictions');
	}

	if (packageToPurchase.price_per_point > 0.1) {
		warnings.push('This package has a high price per point ratio');
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Validate point transaction
 * @param transaction - Transaction to validate
 * @param previousBalance - Previous balance before transaction
 * @returns Validation result with errors and warnings
 */
export function validatePointTransaction(
	transaction: PointTransaction,
	previousBalance: PointBalance
): PointsValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Required fields validation
	if (!transaction.id) {
		errors.push('Transaction must have an ID');
	}

	if (!transaction.user_id) {
		errors.push('Transaction must have a user ID');
	}

	if (typeof transaction.amount !== 'number') {
		errors.push('Transaction amount must be a number');
	}

	if (!transaction.type) {
		errors.push('Transaction must have a type');
	}

	if (!transaction.createdAt) {
		errors.push('Transaction must have a timestamp');
	}

	// Business logic validation
	if (transaction.type === 'deduction' && transaction.amount > 0) {
		errors.push('Deduction transactions must have negative amounts');
	}

	if (transaction.type === 'purchase' && transaction.amount < 0) {
		errors.push('Purchase transactions must have positive amounts');
	}

	// Balance consistency validation
	if (transaction.type === 'deduction') {
		const absoluteAmount = Math.abs(transaction.amount);
		if (absoluteAmount > previousBalance.total_points) {
			errors.push('Cannot deduct more points than available');
		}
	}

	// Timestamp validation
	const transactionTime = new Date(transaction.createdAt);
	const now = new Date();
	const timeDiff = now.getTime() - transactionTime.getTime();

	if (timeDiff < 0) {
		errors.push('Transaction timestamp cannot be in the future');
	}

	if (timeDiff > 24 * 60 * 60 * 1000) {
		warnings.push('Transaction is older than 24 hours');
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Validate point transfer between users
 * @param fromUserId - Source user ID
 * @param toUserId - Destination user ID
 * @param amount - Amount to transfer
 * @param fromBalance - Source user balance
 * @returns Validation result with errors and warnings
 */
export function validatePointTransfer(
	fromUserId: string,
	toUserId: string,
	amount: number,
	fromBalance: PointBalance
): PointsValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// User validation
	if (fromUserId === toUserId) {
		errors.push('Cannot transfer points to yourself');
	}

	if (!fromUserId || !toUserId) {
		errors.push('Both user IDs are required');
	}

	// Amount validation
	if (amount <= 0) {
		errors.push('Transfer amount must be positive');
	}

	if (amount > fromBalance.purchased_points) {
		errors.push('Cannot transfer more points than purchased points available');
	}

	// Business rule validation
	if (amount > 1000) {
		warnings.push('Large transfers may require additional verification');
	}

	if (amount < 1) {
		warnings.push('Very small transfers may not be cost-effective');
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Validate point refund request
 * @param transactionId - Transaction ID to refund
 * @param refundAmount - Amount to refund
 * @param originalTransaction - Original transaction
 * @param currentBalance - Current user balance
 * @returns Validation result with errors and warnings
 */
export function validatePointRefund(
	transactionId: string,
	refundAmount: number,
	originalTransaction: PointTransaction,
	currentBalance: PointBalance
): PointsValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Transaction validation
	if (!transactionId) {
		errors.push('Transaction ID is required');
	}

	if (refundAmount <= 0) {
		errors.push('Refund amount must be positive');
	}

	// Original transaction validation
	if (originalTransaction.type !== 'purchase') {
		errors.push('Only purchase transactions can be refunded');
	}

	if (originalTransaction.amount < refundAmount) {
		errors.push('Cannot refund more than originally purchased');
	}

	// Time-based validation (refunds only within 30 days)
	const transactionTime = new Date(originalTransaction.createdAt);
	const now = new Date();
	const daysSincePurchase = (now.getTime() - transactionTime.getTime()) / (1000 * 60 * 60 * 24);

	if (daysSincePurchase > 30) {
		errors.push('Refunds are only available within 30 days of purchase');
	}

	// Balance validation
	if (refundAmount > currentBalance.purchased_points) {
		warnings.push('Refund amount exceeds current purchased points balance');
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Validate point expiration
 * @param points - Points to check
 * @param purchaseDate - Date points were purchased
 * @param expirationDays - Days until expiration
 * @returns Validation result with expiration information and warnings
 */
export function validatePointExpiration(
	_points: number,
	purchaseDate: Date,
	expirationDays: number = 365
): {
	isExpired: boolean;
	daysUntilExpiration: number;
	warnings: string[];
} {
	const warnings: string[] = [];
	const now = new Date();
	const expirationDate = new Date(purchaseDate);
	expirationDate.setDate(expirationDate.getDate() + expirationDays);

	const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
	const isExpired = daysUntilExpiration <= 0;

	// Warning thresholds
	if (daysUntilExpiration <= 30 && daysUntilExpiration > 0) {
		warnings.push(`Points will expire in ${daysUntilExpiration} days`);
	}

	if (daysUntilExpiration <= 7 && daysUntilExpiration > 0) {
		warnings.push(`Points will expire soon! Only ${daysUntilExpiration} days remaining`);
	}

	return {
		isExpired,
		daysUntilExpiration: Math.max(0, daysUntilExpiration),
		warnings,
	};
}

/**
 * Validate point package configuration
 * @param packages - Array of point packages to validate
 * @returns Validation result with errors and warnings
 */
export function validatePointPackages(packages: PointPurchaseOption[]): PointsValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (!Array.isArray(packages) || packages.length === 0) {
		errors.push('At least one point package must be available');
		return { isValid: false, errors, warnings };
	}

	// Check for duplicate package IDs
	const packageIds = packages.map(pkg => pkg.id);
	const duplicateIds = packageIds.filter((id, index) => packageIds.indexOf(id) !== index);
	if (duplicateIds.length > 0) {
		errors.push(`Duplicate package IDs found: ${duplicateIds.join(', ')}`);
	}

	// Validate each package
	for (const pkg of packages) {
		const packageValidation = validatePointPurchase(
			pkg,
			{
				total_points: 0,
				purchased_points: 0,
				free_questions: 0,
				can_play_free: false,
				daily_limit: 0,
				next_reset_time: null,
			},
			packages
		);
		if (!packageValidation.isValid) {
			errors.push(`Package ${pkg.id}: ${packageValidation.errors.join(', ')}`);
		}
		if (packageValidation.warnings) {
			warnings.push(`Package ${pkg.id}: ${packageValidation.warnings.join(', ')}`);
		}
	}

	// Check for reasonable price ranges
	const prices = packages.map(pkg => pkg.price);
	const minPrice = Math.min(...prices);
	const maxPrice = Math.max(...prices);

	if (maxPrice / minPrice > 100) {
		warnings.push('Very large price range between packages may indicate pricing issues');
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
	};
}
