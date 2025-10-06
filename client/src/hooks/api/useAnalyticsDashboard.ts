/**
 * Analytics Dashboard Hook
 *
 * @module UseAnalyticsDashboard
 * @description React Query hooks for analytics dashboard functionality
 */
import { CompleteUserAnalytics, UserAnalyticsQuery } from '@shared';
import { clientLogger as logger } from '@shared';
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
      logger.userInfo('Fetching user analytics');
      const result = await apiService.getUserAnalytics();
      logger.userInfo('user analytics fetched successfully', {
        userId: result.basic?.userId,
      });
      return result;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
      logger.userInfo('Fetching popular topics', { query });
      const result = await apiService.getPopularTopics(query);
      logger.userInfo('Popular topics fetched successfully', {
        totalTopics: result.topics.length,
      });
      return result;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
      logger.userInfo('Fetching difficulty stats', { query });
      const result = await apiService.getDifficultyStats(query);
      logger.userInfo('Difficulty stats fetched successfully', {
        totalDifficulties: result.difficulties.length,
      });
      return result;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
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
      logger.userInfo('Fetching real-time analytics');
      const result = await apiService.getUserAnalytics();
      logger.userInfo('Real-time analytics fetched successfully');
      return result;
    },
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
    refetchInterval: 30 * 1000,
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
      logger.userInfo('Exporting analytics data', { format });
      const result = await apiService.getUserAnalytics();
      logger.userInfo('Analytics data exported successfully', { format });
      return result;
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    enabled: false,
  });
};
