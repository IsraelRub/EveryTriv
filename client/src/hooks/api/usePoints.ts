import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientLogger } from '@shared';

import { pointsService } from '../../services';
import type { PointBalance } from '../../types';
import { useAppSelector, useAppDispatch } from '../layers/utils';
import { selectUserPointBalance, selectCanPlayFree } from '../../redux/selectors';
import { deductPoints } from '../../redux/slices';

// Query keys
export const pointsKeys = {
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
  const canPlay = (pointBalance?.total_points || 0) >= questionCount || canPlayFree;
	
	return {
		data: canPlay,
		isLoading: false,
		error: null,
		refetch: () => {}, // No need to refetch from API
	};
};

export const useConfirmPointPurchase = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (paymentIntentId: string) => pointsService.confirmPointPurchase(paymentIntentId),
		onSuccess: () => {
			// Invalidate points-related queries
			queryClient.invalidateQueries({ queryKey: pointsKeys.all });
		},
	});
};

// Mutations
export const useDeductPoints = () => {
	const queryClient = useQueryClient();
	const dispatch = useAppDispatch();

	return useMutation({
		mutationFn: ({ questionCount, gameHistoryId }: { questionCount: number; gameHistoryId?: string }) =>
			pointsService.deductPoints(questionCount, gameHistoryId || 'standard'),
		onMutate: async ({ questionCount }) => {
			// Cancel any outgoing refetches
			try {
				await queryClient.cancelQueries({ queryKey: pointsKeys.balance() });
			} catch (error) {
				// Ignore errors when canceling queries
				// Use logger at a low level to avoid noise
				clientLogger.apiDebug('Error canceling queries', {
					error: error instanceof Error ? error.message : String(error),
				});
			}

			// Snapshot the previous value
			const previousBalance = queryClient.getQueryData(pointsKeys.balance());

			// Optimistically update the balance
			queryClient.setQueryData(pointsKeys.balance(), (old: PointBalance | undefined) => {
				if (!old)
					return {
						total_points: 0,
						free_questions: 0,
						purchased_points: 0,
						daily_limit: 0,
						can_play_free: false,
						next_reset_time: new Date().toISOString(),
					};
				return {
					...old,
					total_points: Math.max(0, old.total_points - questionCount),
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

