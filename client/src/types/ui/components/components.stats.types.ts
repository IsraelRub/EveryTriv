/**
 * Statistics Component Types
 * @module StatsComponentTypes
 * @description UI component prop types for statistics and user data components
 */

/**
 * Points Manager Component Props
 * @interface PointsManagerProps
 * @description Props for the PointsManager component
 * @used_by client/src/components/points/PointsManager.tsx
 */
export interface PointsManagerProps {
	/** Optional close handler */
	onClose?: () => void;
}

/**
 * Game Session Statistics Component Props
 * @interface GameSessionStatsProps
 * @description Props for the GameSessionStats component
 * @used_by client/src/components/stats/GameSessionStats.tsx
 */
export interface GameSessionStatsProps {
	/** Game session data */
	session: {
		id: string;
		startTime: number;
		endTime?: number;
		totalQuestions: number;
		correctAnswers: number;
		score: number;
		difficulty: string;
		topic: string;
	};
	/** Optional CSS class */
	className?: string;
}

/**
 * User Statistics Card Component Props
 * @interface UserStatsCardProps
 * @description Props for the UserStatsCard component
 * @used_by client/src/components/stats/UserStatsCard.tsx
 */
export interface UserStatsCardProps {
	/** User data */
	user: {
		username: string;
		created_at: Date;
		dateOfBirth?: Date;
		lastLogin?: Date;
		score: number;
	};
	/** Optional CSS class */
	className?: string;
}

/**
 * Subscription Plans Component Props
 * @interface SubscriptionPlansProps
 * @description Props for the SubscriptionPlans component
 * @used_by client/src/components/subscription/SubscriptionPlans.tsx
 */
export interface SubscriptionPlansProps {
	/** Subscription plans data */
	plans: import('@shared').SubscriptionPlans;
	/** Optional plan selection handler */
	onPlanSelect?: (plan: string) => void;
	/** Optional CSS class */
	className?: string;
}
