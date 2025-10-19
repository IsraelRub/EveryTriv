import { clientLogger as logger } from '@shared/services';
import type { User } from '@shared/types';
import type { UserRole } from '@shared/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { USER_DEFAULT_VALUES } from '../../constants';
import { setAuthenticated, setUser } from '../../redux/slices/userSlice';
import { authService } from '../../services';
import type {
  ExtendedUserProfileUpdateRequest,
  UserLoginRequest,
  UserRegisterRequest,
} from '../../types';
import type { RootState } from '../../types/redux/state.types';
import { useAppDispatch } from '../layers/utils';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  currentUser: () => [...authKeys.all, 'current-user'] as const,
};

// Hooks
export const useCurrentUser = () => {
  // Use Redux state instead of local state for consistency with HOCs
  const { isAuthenticated } = useSelector((state: RootState) => state.user);

  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: () => authService.getCurrentUser(),
    staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
    enabled: isAuthenticated, // Only run if authenticated
  });
};

// Mutations
export const useLogin = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (credentials: UserLoginRequest) =>
      authService.login({
        username: credentials.email, // Use email as username
        email: credentials.email,
        password: credentials.password,
      }),
    onSuccess: data => {
      // Update Redux state for HOCs consistency
      dispatch(setAuthenticated(true));
      // Create full User object from partial data with dynamic defaults
      if (!data.user) {
        throw new Error('User data not found in authentication response');
      }
      const fullUser: User = {
        ...data.user,
        role: data.user.role as UserRole,
        ...USER_DEFAULT_VALUES,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dispatch(setUser(fullUser));

      // Invalidate auth-related queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      // Clear any cached data that might be user-specific
      queryClient.clear();
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Update Redux state for HOCs consistency
      dispatch(setAuthenticated(false));
      dispatch(setUser(null));

      // Clear all cached data on logout
      queryClient.clear();
      logger.securityLogout('User logged out, cache cleared');
    },
    onError: error => {
      // Even if logout fails, clear the cache for security
      dispatch(setAuthenticated(false));
      dispatch(setUser(null));
      queryClient.clear();
      logger.securityLogout('Logout failed, but cache cleared for security', { error });
    },
  });
};

export const useRefreshToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.refreshToken(),
    onSuccess: () => {
      // Invalidate auth-related queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (credentials: UserRegisterRequest) => authService.register(credentials),
    onSuccess: data => {
      // Update Redux state for HOCs consistency
      dispatch(setAuthenticated(true));
      // Create full User object from partial data with dynamic defaults
      if (!data.user) {
        throw new Error('User data not found in authentication response');
      }
      const fullUser: User = {
        ...data.user,
        role: data.user.role as UserRole,
        ...USER_DEFAULT_VALUES,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dispatch(setUser(fullUser));

      // Invalidate auth-related queries
      queryClient.invalidateQueries({ queryKey: authKeys.all });
      // Clear any cached data that might be user-specific
      queryClient.clear();
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (data: ExtendedUserProfileUpdateRequest) => authService.updateUserProfile(data),
    onSuccess: data => {
      // Update Redux state for HOCs consistency
      // Create full User object from partial data with dynamic defaults
      const fullUser: User = {
        ...data,
        role: data.role as UserRole,
        ...USER_DEFAULT_VALUES,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      dispatch(setUser(fullUser));

      // Invalidate current user query
      queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });
    },
  });
};
