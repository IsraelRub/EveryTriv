/**
 * Admin Users Hooks
 *
 * @module AdminUsersHooks
 * @description React Query hooks for admin user management
 */

import { useQuery } from '@tanstack/react-query';

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
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
	});
};
