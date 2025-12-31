/**
 * Account Management Hook
 *
 * @module UseAccountManagement
 * @description React Query hooks for account management functionality
 */
import { useMutation } from '@tanstack/react-query';

import type { ChangePasswordData } from '@shared/types';
import { authService } from '@/services';

/**
 * Hook for changing user password
 * @returns Mutation for changing password
 */
export const useChangePassword = () => {
	return useMutation({
		mutationFn: (passwordData: ChangePasswordData) => authService.changePassword(passwordData),
	});
};
