/**
 * Subscription-related types for EveryTriv
 *
 * @module SubscriptionTypes
 * @description Type definitions for subscription and billing data structures
 */

/**
 * Base subscription data interface
 * @interface BaseSubscriptionData
 * @description Core subscription data structure
 */
export interface BaseSubscriptionData {
	/** Unique subscription identifier */
	subscriptionId: string;
	/** Subscription plan type */
	plan: string;
	/** Subscription status */
	status: string;
	/** Subscription start date */
	startDate: string;
	/** Subscription end date */
	endDate: string;
	/** Subscription price */
	price: number;
	/** Billing cycle */
	billingCycle: string;
	/** Available features */
	features: string[];
	/** Cancellation date (if cancelled) */
	cancelledAt?: string;
}

/**
 * Subscription data interface for UserEntity
 * @interface UserEntitySubscription
 * @description Subscription data structure as stored in UserEntity
 */
export type UserEntitySubscription = BaseSubscriptionData;

/**
 * Subscription data interface with nullable fields
 * @interface SubscriptionData
 * @description Complete subscription information with nullable fields for free plans
 */
export type SubscriptionData = {
	subscriptionId: string | null;
	endDate: string | null;
	billingCycle: string | null;
	plan: 'free' | 'basic' | 'premium' | 'pro';
	planType?: string;
	status: string;
	id?: string;
	planDetails?: SubscriptionPlanDetails;
	autoRenew?: boolean;
	nextBillingDate?: Date;
	startDate: string;
	price: number;
	features: string[];
	cancelledAt?: string;
};

/**
 * User stats with subscription interface
 * @interface UserStatsWithSubscription
 * @description User statistics including subscription data
 */
export interface UserStatsWithSubscription {
	/** Topics played with question counts */
	topicsPlayed: Record<string, number>;
	/** Difficulty statistics */
	difficultyStats: Record<string, { correct: number; total: number }>;
	/** Total questions answered */
	totalQuestions: number;
	/** Total correct answers */
	correctAnswers: number;
	/** Last gameplay timestamp */
	lastPlayed: Date;
	/** Subscription data */
	subscription?: UserEntitySubscription;
}

/**
 * Subscription plan details interface
 * @interface SubscriptionPlanDetails
 * @description Details for each subscription plan
 */
export interface SubscriptionPlanDetails {
	/** Plan name */
	name?: string;
	/** Plan price */
	price: number;
	/** Plan currency */
	currency?: string;
	/** Billing interval */
	interval?: string;
	/** Available features */
	features: string[];
	/** Point bonus for plan */
	pointBonus?: number;
	/** Question limit */
	questionLimit?: number;
}

/**
 * Available subscription plans
 */
export interface SubscriptionPlans {
	basic: SubscriptionPlanDetails;
	premium: SubscriptionPlanDetails;
	pro: SubscriptionPlanDetails;
	enterprise: SubscriptionPlanDetails;
}
