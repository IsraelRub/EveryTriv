import { useSelector } from 'react-redux';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { GameMode, UserRole } from '@shared/constants';
import { clientLogger as logger } from '@shared/services';
import type { CreditBalance } from '@shared/types';
import { calculateNewBalance, calculateRequiredCredits, getErrorMessage } from '@shared/utils';

import { selectCanPlayFree, selectUserCreditBalance, selectUserRole } from '../redux/selectors';
import { deductCredits, setCreditBalance } from '../redux/slices';
import { creditsService } from '../services';
import type { CreditsPurchaseRequest, RootState } from '../types';
import { useAppDispatch, useAppSelector } from './useRedux';

// Query keys
const creditsKeys = {
	all: ['credits'] as const,
	balance: () => [...creditsKeys.all, 'balance'] as const,
	packages: () => [...creditsKeys.all, 'packages'] as const,
	canPlay: (questionsPerRequest: number, gameMode: GameMode) =>
		[...creditsKeys.all, 'can-play', questionsPerRequest, gameMode] as const,
	history: (limit: number) => [...creditsKeys.all, 'history', limit] as const,
};

export const useCanPlay = (questionsPerRequest: number = 1, gameMode: GameMode = GameMode.QUESTION_LIMITED) => {
	const creditBalance = useAppSelector(selectUserCreditBalance);
	const canPlayFree = useAppSelector(selectCanPlayFree);
	const userRole = useAppSelector(selectUserRole);

	// Admin users can always play without credits
	if (userRole === UserRole.ADMIN) {
		return {
			data: true,
			isLoading: false,
			error: null,
			refetch: () => {},
		};
	}

	// Calculate required credits based on game mode
	const requiredCredits = calculateRequiredCredits(questionsPerRequest, gameMode);

	// Check if user has free questions available
	const hasFreeQuestions = canPlayFree && (creditBalance?.freeQuestions ?? 0) >= questionsPerRequest;

	// Calculate if user can play based on Redux state
	const canPlay = hasFreeQuestions || (creditBalance?.totalCredits ?? 0) >= requiredCredits;

	// Debug logging
	if (process.env.NODE_ENV === 'development') {
		logger.apiDebug('Can play check', {
			questionsPerRequest,
			gameMode,
			requiredCredits,
			credits: creditBalance?.totalCredits ?? 0,
			freeQuestions: creditBalance?.freeQuestions ?? 0,
			canPlayFree: hasFreeQuestions,
			canPlay,
		});
	}

	return {
		data: canPlay,
		isLoading: false,
		error: null,
		refetch: () => {}, // No need to refetch from API
	};
};

/**
 * Hook for deducting credits
 * @returns Mutation for deducting credits based on question count and game mode
 */
export const useDeductCredits = () => {
	const queryClient = useQueryClient();
	const dispatch = useAppDispatch();
	const userRole = useAppSelector(selectUserRole);

	return useMutation({
		mutationFn: ({ questionsPerRequest, gameMode }: { questionsPerRequest: number; gameMode?: GameMode }) =>
			creditsService.deductCredits(questionsPerRequest, gameMode ?? GameMode.QUESTION_LIMITED),
		onMutate: async ({ questionsPerRequest, gameMode }) => {
			// Skip optimistic update for admin users (server handles it)
			if (userRole === UserRole.ADMIN) {
				return { previousBalance: queryClient.getQueryData(creditsKeys.balance()) };
			}
			// Cancel any outgoing refetches
			try {
				await queryClient.cancelQueries({ queryKey: creditsKeys.balance() });
			} catch (error) {
				// Ignore errors when canceling queries
				// Use logger at a low level to avoid noise
				logger.apiDebug('Error canceling queries', {
					error: getErrorMessage(error),
				});
			}

			// Snapshot the previous value
			const previousBalance = queryClient.getQueryData(creditsKeys.balance());

			// Normalize game mode
			const normalizedGameMode = gameMode ?? GameMode.QUESTION_LIMITED;

			// Optimistically update the balance using shared deduction logic
			queryClient.setQueryData(creditsKeys.balance(), (old: CreditBalance | undefined) => {
				if (!old) {
					return {
						totalCredits: 0,
						credits: 0,
						freeQuestions: 0,
						purchasedCredits: 0,
						dailyLimit: 0,
						canPlayFree: false,
						nextResetTime: new Date().toISOString(),
					};
				}

				// Use shared deduction logic to ensure consistency with server
				const deductionResult = calculateNewBalance(old, questionsPerRequest, normalizedGameMode);
				return deductionResult.newBalance;
			});

			return { previousBalance };
		},
		onError: (_err, _variables, context) => {
			// Rollback on error
			if (context?.previousBalance) {
				queryClient.setQueryData(creditsKeys.balance(), context.previousBalance);
			}
		},
		onSettled: (_, __, { questionsPerRequest }) => {
			// Skip Redux update for admin users (server doesn't deduct credits)
			if (userRole !== UserRole.ADMIN) {
				// Update Redux state
				dispatch(deductCredits(questionsPerRequest));
			}
			// Always refetch after error or success to get latest balance from server
			queryClient.invalidateQueries({ queryKey: creditsKeys.all });
		},
	});
};

/**
 * Hook for getting user credit balance
 * @returns Query result with credit balance data
 */
export const useCreditBalance = () => {
	const { isAuthenticated } = useSelector((state: RootState) => state.user);
	const dispatch = useAppDispatch();

	return useQuery({
		queryKey: creditsKeys.balance(),
		queryFn: async () => {
			const balance = await creditsService.getCreditBalance();
			// Update Redux state when balance is fetched
			dispatch(
				setCreditBalance({
					balance: balance.totalCredits,
					freeQuestions: balance.freeQuestions ?? 0,
					purchasedCredits: balance.purchasedCredits ?? 0,
					dailyLimit: balance.dailyLimit,
					nextResetTime: balance.nextResetTime,
					// Store as ISO string to keep Redux state serializable
					lastUpdated: new Date().toISOString(),
				})
			);
			return balance;
		},
		staleTime: 5 * 60 * 1000, // Consider stale after 5 minutes
		enabled: isAuthenticated, // Only fetch when user is authenticated
	});
};

/**
 * Hook for getting credit packages
 * @returns Query result with available credit packages
 */
export const useCreditPackages = () => {
	return useQuery({
		queryKey: creditsKeys.packages(),
		queryFn: () => creditsService.getCreditPackages(),
		staleTime: 10 * 60 * 1000, // Consider stale after 10 minutes
	});
};

/**
 * Hook for purchasing credits
 * @returns Mutation for purchasing credits package
 */
export const usePurchaseCredits = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (request: CreditsPurchaseRequest) => creditsService.purchaseCredits(request),
		onSuccess: () => {
			// Invalidate balance query
			queryClient.invalidateQueries({ queryKey: creditsKeys.balance() });
		},
	});
};
