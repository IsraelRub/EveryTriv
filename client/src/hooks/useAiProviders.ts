/**
 * AI Providers Hooks
 *
 * @module AiProvidersHooks
 * @description React Query hooks for AI provider statistics
 */

import { useQuery } from '@tanstack/react-query';

import { adminService } from '@/services';

/**
 * Hook to fetch AI provider statistics (Admin only)
 * @returns React Query hook result with provider statistics
 */
export const useAiProviderStats = () => {
	return useQuery({
		queryKey: ['aiProviderStats'],
		queryFn: () => adminService.getAiProviderStats(),
		staleTime: 2 * 60 * 1000, // 2 minutes - stats change frequently
		gcTime: 5 * 60 * 1000, // 5 minutes
	});
};

/**
 * Hook to fetch AI provider health status (Public)
 * @returns React Query hook result with provider health status
 */
export const useAiProviderHealth = () => {
	return useQuery({
		queryKey: ['aiProviderHealth'],
		queryFn: () => adminService.getAiProviderHealth(),
		staleTime: 30 * 1000, // 30 seconds - health changes frequently
		gcTime: 2 * 60 * 1000, // 2 minutes
		refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
	});
};
