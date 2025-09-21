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
	subscriptionId: string;
	plan: string;
	status: string;
	startDate: string;
	endDate: string;
	price: number;
	billingCycle: string;
	features: string[];
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
	topicsPlayed: Record<string, number>;
	difficultyStats: Record<string, { correct: number; total: number }>;
	totalQuestions: number;
	correctAnswers: number;
	lastPlayed: Date;
	subscription?: UserEntitySubscription;
}

/**
 * Subscription plan details interface
 * @interface SubscriptionPlanDetails
 * @description Details for each subscription plan
 */
export interface SubscriptionPlanDetails {
	name?: string;
	price: number;
	currency?: string;
	interval?: string;
	features: string[];
	pointBonus?: number;
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
