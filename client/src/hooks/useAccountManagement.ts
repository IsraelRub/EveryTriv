/**
 * Account Management Hook
 *
 * @module UseAccountManagement
 * @description React Query hooks for account management functionality
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { clientLogger as logger } from '@shared/services';
import { getErrorMessage } from '@shared/utils';

import { setAuthenticated, setUser } from '../redux/slices';
import { authService, userService } from '../services';
import { useAppDispatch } from './useRedux';

/**
 * Hook for deleting user account
 * @returns Mutation for deleting user account
 */
export const useDeleteUserAccount = () => {
	const queryClient = useQueryClient();
	const dispatch = useAppDispatch();

	return useMutation({
		mutationFn: async () => {
			logger.userInfo('Deleting user account');
			return userService.deleteAccount();
		},
		onSuccess: data => {
			// Update Redux state for HOCs consistency
			dispatch(setAuthenticated(false));
			dispatch(setUser(null));

			// Clear all user-related queries
			queryClient.clear();
			logger.userInfo('User account deleted successfully', {
				success: data.success,
			});
		},
		onError: error => {
			logger.userError('Failed to delete user account', { error: getErrorMessage(error) });
		},
	});
};

/**
 * Hook for changing user password
 * @returns Mutation for changing password
 */
export const useChangePassword = () => {
	return useMutation({
		mutationFn: async (passwordData: { currentPassword: string; newPassword: string }) => {
			logger.userInfo('Changing user password');
			return authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
		},
		onSuccess: () => {
			logger.userInfo('Password changed successfully');
		},
		onError: error => {
			logger.userError('Failed to change password', {
				error: getErrorMessage(error),
			});
		},
	});
};
