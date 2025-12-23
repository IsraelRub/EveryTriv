/**
 * Account Management Hook
 *
 * @module UseAccountManagement
 * @description React Query hooks for account management functionality
 */
import { useMutation } from '@tanstack/react-query';

import type { ChangePasswordData } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { authService, clientLogger as logger } from '@/services';

/**
 * Hook for changing user password
 * @returns Mutation for changing password
 */
export const useChangePassword = () => {
	return useMutation({
		mutationFn: async (passwordData: ChangePasswordData) => {
			logger.userInfo('Changing user password');
			return authService.changePassword(passwordData);
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
