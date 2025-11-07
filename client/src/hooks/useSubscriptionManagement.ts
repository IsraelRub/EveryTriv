/**
 * Subscription Management Hook
 *
 * @module UseSubscriptionManagement
 * @description React Query hooks for subscription management functionality
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { BillingCycle, PlanType } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

import { userService } from '../services';
import { authKeys } from './useAuth';

// Helper function to invalidate subscription-related queries consistently
const invalidateSubscriptionQueries = (queryClient: ReturnType<typeof useQueryClient>) => {
	queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
	queryClient.invalidateQueries({ queryKey: ['subscription'] });
	queryClient.invalidateQueries({ queryKey: ['userProfile'] });
};

/**
 * Hook for creating subscription
 * @returns Mutation for creating subscription
 */
export const useCreateSubscription = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ plan, billingCycle }: { plan: PlanType; billingCycle?: BillingCycle }) => {
			logger.userInfo('Creating subscription', { planType: plan, billingCycle });
			return userService.createSubscription(plan, billingCycle);
		},
		onSuccess: data => {
			// Invalidate queries with consistent keys
			invalidateSubscriptionQueries(queryClient);
			const response = data as Partial<{
				plan: PlanType;
				planType: PlanType;
				billingCycle: BillingCycle;
				status: string;
			}>;
			const responsePlan = response.planType ?? response.plan;
			const normalizedPlan = responsePlan && Object.values(PlanType).includes(responsePlan) ? responsePlan : undefined;
			const normalizedCycle =
				response.billingCycle && Object.values(BillingCycle).includes(response.billingCycle)
					? response.billingCycle
					: undefined;
			logger.userInfo('Subscription created successfully', {
				planType: normalizedPlan,
				billingCycle: normalizedCycle,
				status: response.status,
			});
		},
		onError: error => {
			logger.userError('Failed to create subscription', { error: getErrorMessage(error) });
		},
	});
};

/**
 * Hook for canceling subscription
 * @returns Mutation for canceling subscription
 */
export const useCancelSubscription = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			logger.userInfo('Canceling subscription');
			return userService.cancelSubscription();
		},
		onSuccess: data => {
			// Invalidate queries with consistent keys
			invalidateSubscriptionQueries(queryClient);
			logger.userInfo('Subscription canceled successfully', {
				success: data.success,
				message: data.message,
			});
		},
		onError: error => {
			logger.userError('Failed to cancel subscription', { error: getErrorMessage(error) });
		},
	});
};
