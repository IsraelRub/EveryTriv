import { SubscriptionPlans } from '@shared/types';

/**
 * Statistics Component Types
 * @module StatsComponentTypes
 * @description UI component prop types for statistics and user data components
 */

/**
 * Subscription Plans Component Props
 * @interface SubscriptionPlansProps
 * @description Props for the SubscriptionPlans component
 * @used_by client/src/components/subscription/SubscriptionPlans.tsx
 */
export interface SubscriptionPlansProps {
	plans: SubscriptionPlans;
	onPlanSelect?: (plan: string) => void;
	className?: string;
}
