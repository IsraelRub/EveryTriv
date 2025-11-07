/**
 * Subscription-related types for EveryTriv
 *
 * @module SubscriptionTypes
 * @description Type definitions for subscription and billing data structures
 */
import { PlanType, SUBSCRIPTION_PLANS } from '@shared/constants';

/**
 * Subscription data interface with nullable fields
 * @interface SubscriptionData
 * @description Complete subscription information with nullable fields for free plans
 */
export type SubscriptionData = {
	subscriptionId: string | null;
	endDate: Date | null;
	billingCycle: string | null;
	planType: PlanType;
	status: string;
	id?: string;
	planDetails?: SubscriptionPlanDetails;
	autoRenew?: boolean;
	nextBillingDate?: Date;
	startDate: Date;
	price: number;
	features: string[];
	cancelledAt?: Date;
};

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
	features: string[] | readonly string[];
	pointBonus?: number;
	questionLimit?: number;
}

/**
 * Available subscription plans
 * @type SubscriptionPlans
 * @description Type derived from SUBSCRIPTION_PLANS constant
 */
export type SubscriptionPlans = typeof SUBSCRIPTION_PLANS;
