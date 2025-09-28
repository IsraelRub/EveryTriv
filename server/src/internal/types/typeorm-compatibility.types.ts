/**
 * TypeORM CLI Compatibility Types and Constants
 *
 * This file contains all types and constants that are needed for TypeORM CLI
 * to work properly, without depending on @shared imports.
 *
 * @module TypeORMCompatibility
 * @description Centralized types and constants for TypeORM entities
 */

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export enum PaymentMethod {
	CREDIT_CARD = 'credit_card',
	PAYPAL = 'paypal',
	STRIPE = 'stripe',
	APPLE_PAY = 'apple_pay',
	GOOGLE_PAY = 'google_pay',
}

export enum PaymentStatus {
	PENDING = 'pending',
	COMPLETED = 'completed',
	FAILED = 'failed',
	CANCELLED = 'cancelled',
	REFUNDED = 'refunded',
}

export interface PaymentMetadata {
	transactionId?: string;
	gatewayResponse?: Record<string, unknown>;
	refundReason?: string;
	gatewayTransactionId?: string;
	paymentMethodDetails?: Record<string, unknown>;
	currency?: string;
}

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export enum SubscriptionStatus {
	ACTIVE = 'active',
	CANCELLED = 'cancelled',
	EXPIRED = 'expired',
	PENDING = 'pending',
	SUSPENDED = 'suspended',
}

export interface SubscriptionData {
	planId: string;
	planName: string;
	price: number;
	currency: string;
	billingCycle: 'monthly' | 'yearly';
	features: string[];
	trialPeriod?: number;
	renewalDate?: string;
	cancellationPolicy?: string;
	upgradeEligible?: boolean;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface ServerUserPreferences {
	language?: string;
	theme?: 'light' | 'dark' | 'auto';
	notifications?: boolean;
	soundEnabled?: boolean;
	musicEnabled?: boolean;
	animationsEnabled?: boolean;
	profilePublic?: boolean;
	showStats?: boolean;
	difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
	timeLimit?: number;
	questionLimit?: number;
	showHints?: boolean;
	showExplanations?: boolean;
}

export interface UserAddress {
	street?: string;
	city?: string;
	state?: string;
	country?: string;
	postalCode?: string;
	countryCode?: string;
	phoneNumber?: string;
	addressLine2?: string;
	isDefault?: boolean;
}

export const DEFAULT_USER_PREFERENCES: ServerUserPreferences = {
	language: 'en',
	theme: 'light',
	notifications: true,
	soundEnabled: true,
	musicEnabled: true,
	animationsEnabled: true,
	profilePublic: false,
	showStats: true,
	difficulty: 'medium',
	timeLimit: 30,
	questionLimit: 10,
	showHints: true,
	showExplanations: true,
};

// ============================================================================
// POINTS TYPES
// ============================================================================

export enum PointTransactionType {
	DAILY_RESET = 'daily_reset',
	PURCHASE = 'purchase',
	DEDUCTION = 'deduction',
	GAME_USAGE = 'game_usage',
	ADMIN_ADJUSTMENT = 'admin_adjustment',
	REFUND = 'refund',
}

export enum PointSource {
	DAILY_BONUS = 'daily_bonus',
	PURCHASE = 'purchase',
	GAME_USAGE = 'game_usage',
	ADMIN_ADJUSTMENT = 'admin_adjustment',
	REFUND = 'refund',
}

export const POINTS_PRICING_TIERS = {
	BASIC: { points: 100, price: 1.99 },
	STANDARD: { points: 500, price: 7.99 },
	PREMIUM: { points: 1000, price: 14.99 },
	ULTIMATE: { points: 2500, price: 29.99 },
} as const;

// ============================================================================
// APP CONSTANTS
// ============================================================================

export const APP_DESCRIPTION = 'EveryTriv - AI-Powered Trivia Game';
export const APP_NAME = 'EveryTriv';
export const CONTACT_INFO = {
	email: 'support@everytriv.com',
	website: 'https://everytriv.com',
};
export const COUNTRIES = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE'];
export const POPULAR_TOPICS = [
	'General Knowledge',
	'Science',
	'History',
	'Geography',
	'Sports',
	'Entertainment',
	'Technology',
	'Literature',
];


// ============================================================================
// ENVIRONMENT TYPES
// ============================================================================

export enum Environment {
	DEVELOPMENT = 'development',
	STAGING = 'staging',
	PRODUCTION = 'production',
	TEST = 'test',
}

export enum LogLevel {
	ERROR = 'error',
	WARN = 'warn',
	INFO = 'info',
	DEBUG = 'debug',
	VERBOSE = 'verbose',
}
