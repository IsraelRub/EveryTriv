/**
 * Subscription Management Hook
 *
 * @module UseSubscriptionManagement
 * @description React Query hooks for subscription management functionality
 */
import { clientLogger, UserWithSubscription } from '@shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { setUser } from '../../redux/slices/userSlice';
import { apiService } from '../../services/api';
import type { RootState } from '../../types/redux/state.types';
import { useAppDispatch } from '../layers/utils';
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
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.user);

  return useMutation({
    mutationFn: async ({ plan, billingCycle }: { plan: string; billingCycle?: string }) => {
      clientLogger.userInfo('Creating subscription', { plan, billingCycle });
      return apiService.createSubscription(plan, billingCycle);
    },
    onSuccess: data => {
      // Update Redux state for HOCs consistency
      if (
        data &&
        typeof data === 'object' &&
        'user' in data &&
        (data as { user: UserWithSubscription }).user &&
        user
      ) {
        const userData = (data as { user: UserWithSubscription }).user;
        dispatch(setUser({ ...user, subscription: userData.subscription } as never));
      }

      // Invalidate queries with consistent keys
      invalidateSubscriptionQueries(queryClient);
      clientLogger.userInfo('Subscription created successfully', {
        plan: data.plan,
        status: data.status,
      });
    },
    onError: error => {
      clientLogger.userError('Failed to create subscription', { error });
    },
  });
};

/**
 * Hook for canceling subscription
 * @returns Mutation for canceling subscription
 */
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const { user } = useSelector((state: RootState) => state.user);

  return useMutation({
    mutationFn: async () => {
      clientLogger.userInfo('Canceling subscription');
      return apiService.cancelSubscription();
    },
    onSuccess: data => {
      // Update Redux state for HOCs consistency
      if (
        data &&
        typeof data === 'object' &&
        'user' in data &&
        (data as { user: UserWithSubscription }).user &&
        user
      ) {
        const userData = (data as { user: UserWithSubscription }).user;
        dispatch(setUser({ ...user, subscription: userData.subscription } as never));
      }

      // Invalidate queries with consistent keys
      invalidateSubscriptionQueries(queryClient);
      clientLogger.userInfo('Subscription canceled successfully', {
        success: data.success,
        message: data.message,
      });
    },
    onError: error => {
      clientLogger.userError('Failed to cancel subscription', { error });
    },
  });
};
