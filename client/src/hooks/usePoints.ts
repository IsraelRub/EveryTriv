import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { GameMode } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { PointBalance } from '@shared/types';
import { getErrorMessage } from '@shared/utils';

import { selectCanPlayFree, selectUserPointBalance } from '../redux/selectors';
import { deductPoints } from '../redux/slices';
import { pointsService } from '../services';
import { useAppDispatch, useAppSelector } from './useRedux';

// Query keys
const pointsKeys = {
	all: ['points'] as const,
	balance: () => [...pointsKeys.all, 'balance'] as const,
	packages: () => [...pointsKeys.all, 'packages'] as const,
	canPlay: (questionCount: number) => [...pointsKeys.all, 'can-play', questionCount] as const,
	history: (limit: number) => [...pointsKeys.all, 'history', limit] as const,
};

export const useCanPlay = (questionCount: number = 1) => {
	const pointBalance = useAppSelector(selectUserPointBalance);
	const canPlayFree = useAppSelector(selectCanPlayFree);

	// Calculate if user can play based on Redux state
	const canPlay = (pointBalance?.totalPoints ?? 0) >= questionCount || canPlayFree;

	return {
		data: canPlay,
		isLoading: false,
		error: null,
		refetch: () => {}, // No need to refetch from API
	};
};

// Mutations
export const useDeductPoints = () => {
	const queryClient = useQueryClient();
	const dispatch = useAppDispatch();

	return useMutation({
		mutationFn: ({ questionCount, gameMode }: { questionCount: number; gameMode?: GameMode }) =>
			pointsService.deductPoints(questionCount, gameMode ?? GameMode.QUESTION_LIMITED),
		onMutate: async ({ questionCount }) => {
			// Cancel any outgoing refetches
			try {
				await queryClient.cancelQueries({ queryKey: pointsKeys.balance() });
			} catch (error) {
				// Ignore errors when canceling queries
				// Use logger at a low level to avoid noise
				logger.apiDebug('Error canceling queries', {
					error: getErrorMessage(error),
				});
			}

			// Snapshot the previous value
			const previousBalance = queryClient.getQueryData(pointsKeys.balance());

			// Optimistically update the balance
			queryClient.setQueryData(pointsKeys.balance(), (old: PointBalance | undefined) => {
				if (!old) {
					return {
						totalPoints: 0,
						freeQuestions: 0,
						purchasedPoints: 0,
						dailyLimit: 0,
						canPlayFree: false,
						nextResetTime: new Date().toISOString(),
					};
				}
				return {
					...old,
					totalPoints: Math.max(0, old.totalPoints - questionCount),
				};
			});

			return { previousBalance };
		},
		onError: (_err, _variables, context) => {
			// Rollback on error
			if (context?.previousBalance) {
				queryClient.setQueryData(pointsKeys.balance(), context.previousBalance);
			}
		},
		onSettled: (_, __, { questionCount }) => {
			// Update Redux state
			dispatch(deductPoints(questionCount));
			// Always refetch after error or success
			queryClient.invalidateQueries({ queryKey: pointsKeys.all });
		},
	});
};

// Hooks
export const usePointBalance = () => {
	const pointBalance = useAppSelector(selectUserPointBalance);

	return {
		data: pointBalance,
		isLoading: false,
		error: null,
		refetch: () => {}, // No need to refetch from API
	};
};

export const usePointPackages = () => {
	return useQuery({
		queryKey: pointsKeys.packages(),
		queryFn: () => pointsService.getPointPackages(),
		staleTime: 10 * 60 * 1000, // Consider stale after 10 minutes
	});
};

export const usePurchasePoints = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (packageId: string) => pointsService.purchasePoints(packageId),
		onSuccess: () => {
			// Invalidate balance query
			queryClient.invalidateQueries({ queryKey: pointsKeys.balance() });
		},
	});
};

export const useTransactionHistory = (limit: number = 50) => {
	return useQuery({
		queryKey: pointsKeys.history(limit),
		queryFn: () => pointsService.getTransactionHistory(limit),
		staleTime: 60 * 1000, // Consider stale after 1 minute
	});
};
