/**
 * Admin Users Hooks
 *
 * @module AdminUsersHooks
 * @description React Query hooks for admin user management
 */

import { useQuery } from '@tanstack/react-query';

import { TIME_PERIODS_MS } from '@shared/constants';
import { adminService } from '@/services';

/**
 * Hook to fetch all users with pagination (Admin only)
 * @param limit Number of users to fetch per page
 * @param offset Number of users to skip
 * @returns React Query hook result with users list
 */
export const useAllUsers = (limit: number = 50, offset: number = 0) => {
	return useQuery({
		queryKey: ['adminUsers', limit, offset],
		queryFn: () => adminService.getAllUsers(limit, offset),
		staleTime: TIME_PERIODS_MS.FIVE_MINUTES,
		gcTime: TIME_PERIODS_MS.TEN_MINUTES,
	});
};
