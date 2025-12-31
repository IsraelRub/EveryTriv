/**
 * User Preferences Hook
 *
 * @module UseUserPreferences
 * @description React Query hooks for user preferences management
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { UserPreferences } from '@shared/types';
import { authKeys } from '@/hooks/useAuth';
import { clientLogger as logger, queryInvalidationService, userService } from '@/services';

/**
 * Hook for updating user preferences
 * @returns Mutation for updating user preferences
 */
export const useUpdateUserPreferences = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (preferences: Partial<UserPreferences>) => userService.updateUserPreferences(preferences),
		onSuccess: () => {
			// Invalidate current user query to refresh user data with updated preferences
			// This ensures Redux state is updated via App.tsx useEffect that syncs with useCurrentUser
			queryClient.invalidateQueries({ queryKey: authKeys.currentUser() });

			// Invalidate queries with consistent keys
			queryInvalidationService.invalidateUserQueries(queryClient);
			logger.userInfo('User preferences updated successfully');
		},
	});
};
