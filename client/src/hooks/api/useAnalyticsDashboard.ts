/**
 * Analytics Dashboard Hook
 *
 * @module UseAnalyticsDashboard
 * @description React Query hooks for analytics dashboard functionality
 */
import { UserAnalyticsQuery, CompleteUserAnalytics } from '@shared';
import { clientLogger } from '@shared';
import { useQuery } from '@tanstack/react-query';

import { apiService } from '../../services/api';

/**
 * Hook for getting user analytics
 * @returns Query result with user analytics
 */
export const useUserAnalytics = () => {
  return useQuery<CompleteUserAnalytics>({
    queryKey: ['UserAnalytics'],
    queryFn: async () => {
      clientLogger.userInfo('Fetching user analytics');
      const result = await apiService.getUserAnalytics();
      clientLogger.userInfo('user analytics fetched successfully', {
        userId: result.basic?.userId,
      });
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - analytics can change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for getting popular topics
 * @param query Optional analytics query parameters
 * @returns Query result with popular topics data
 */
export const usePopularTopics = (query?: UserAnalyticsQuery) => {
  return useQuery({
    queryKey: ['popularTopics', query],
    queryFn: async () => {
      clientLogger.userInfo('Fetching popular topics', { query });
      const result = await apiService.getPopularTopics(query);
      clientLogger.userInfo('Popular topics fetched successfully', {
        totalTopics: result.topics.length,
      });
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for getting difficulty statistics
 * @param query Optional analytics query parameters
 * @returns Query result with difficulty statistics
 */
export const useDifficultyStats = (query?: UserAnalyticsQuery) => {
  return useQuery({
    queryKey: ['difficultyStats', query],
    queryFn: async () => {
      clientLogger.userInfo('Fetching difficulty stats', { query });
      const result = await apiService.getDifficultyStats(query);
      clientLogger.userInfo('Difficulty stats fetched successfully', {
        totalDifficulties: result.difficulties.length,
      });
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for getting real-time analytics
 * @returns Query result with real-time analytics
 */
export const useRealTimeAnalytics = () => {
  return useQuery({
    queryKey: ['realTimeAnalytics'],
    queryFn: async () => {
      clientLogger.userInfo('Fetching real-time analytics');
      // This would call a real-time analytics endpoint
      const result = await apiService.getUserAnalytics();
      clientLogger.userInfo('Real-time analytics fetched successfully');
      return result;
    },
    staleTime: 30 * 1000, // 30 seconds - real-time data
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

/**
 * Hook for getting analytics export data
 * @param format Export format (csv, json, pdf)
 * @returns Query result with export data
 */
export const useAnalyticsExport = (format: 'csv' | 'json' | 'pdf' = 'json') => {
  return useQuery({
    queryKey: ['analyticsExport', format],
    queryFn: async () => {
      clientLogger.userInfo('Exporting analytics data', { format });
      // This would call an export endpoint
      const result = await apiService.getUserAnalytics();
      clientLogger.userInfo('Analytics data exported successfully', { format });
      return result;
    },
    staleTime: 0, // Always fetch fresh export data
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: false, // Only fetch when explicitly called
  });
};
