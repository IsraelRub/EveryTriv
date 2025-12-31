/**
 * AI Providers Hooks
 *
 * @module AiProvidersHooks
 * @description React Query hooks for AI provider statistics
 */

import { useQuery } from '@tanstack/react-query';

import { TIME_PERIODS_MS } from '@shared/constants';
import { adminService } from '@/services';

/**
 * Hook to fetch AI provider statistics (Admin only)
 * @returns React Query hook result with provider statistics
 */
export const useAiProviderStats = () => {
	return useQuery({
		queryKey: ['aiProviderStats'],
		queryFn: () => adminService.getAiProviderStats(),
		staleTime: TIME_PERIODS_MS.TWO_MINUTES,
		gcTime: TIME_PERIODS_MS.FIVE_MINUTES,
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
		staleTime: 30 * 1000,
		gcTime: TIME_PERIODS_MS.TWO_MINUTES,
		refetchInterval: 30 * 1000,
	});
};
