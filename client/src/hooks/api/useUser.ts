import type { UpdateUserProfileData } from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { selectCurrentUser, selectUserPointBalance } from '../../redux/selectors';
import { updateUserProfile } from '../../redux/slices';
import { userService } from '../../services';
import { useAppDispatch, useAppSelector } from '../layers/utils';

export const useDeductCredits = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) => userService.deductCredits(amount),
    onSuccess: () => {
      // Invalidate credits query
      queryClient.invalidateQueries({ queryKey: userKeys.credits() });
    },
  });
};

// Mutations
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (data: UpdateUserProfileData) => userService.updateUserProfile(data),
    onSuccess: updatedUser => {
      // Update Redux state
      dispatch(updateUserProfile(updatedUser));
      // Invalidate user-related queries
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};

// Hooks that use Redux state instead of API calls
export const useUserCredits = () => {
  const pointBalance = useAppSelector(selectUserPointBalance);

  return {
    data: pointBalance,
    isLoading: false,
    error: null,
    refetch: () => {}, // No need to refetch from API
  };
};

export const useUserProfile = () => {
  const currentUser = useAppSelector(selectCurrentUser);

  return {
    data: currentUser,
    isLoading: false,
    error: null,
    refetch: () => {}, // No need to refetch from API
  };
};

// Query keys
export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  credits: () => [...userKeys.all, 'credits'] as const,
};
