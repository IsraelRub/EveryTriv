import { useSelector } from 'react-redux';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { setAuthenticated, setUser } from '../redux/slices';
import { authService } from '../services';
import type { RootState, UserLoginRequest, UserRegisterRequest } from '../types';
import { useAppDispatch } from './useRedux';

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
		enabled: isAuthenticated,
	});
};

// Mutations
export const useLogin = () => {
	const queryClient = useQueryClient();
	const dispatch = useAppDispatch();

	return useMutation({
		mutationFn: (credentials: UserLoginRequest) =>
			authService.login({
				username: credentials.email,
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
			dispatch(setUser(data.user));

			// Invalidate auth-related queries
			queryClient.invalidateQueries({ queryKey: authKeys.all });
			// Clear any cached data that might be user-specific
			queryClient.clear();
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
			dispatch(setUser(data.user));

			// Invalidate auth-related queries
			queryClient.invalidateQueries({ queryKey: authKeys.all });
			// Clear any cached data that might be user-specific
			queryClient.clear();
		},
	});
};
