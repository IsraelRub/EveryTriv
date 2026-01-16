import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { GameMode, TIME_PERIODS_MS, UserRole } from '@shared/constants';
import type { CreditBalance, CreditsPurchaseRequest, PaymentResult } from '@shared/types';
import { calculateNewBalance, calculateRequiredCredits, getErrorMessage } from '@shared/utils';

import { QUERY_KEYS } from '@/constants';
import { creditsService, clientLogger as logger, paymentService } from '@/services';
import type { DeductCreditsParams } from '@/types';
import { useIsAuthenticated, useUserRole } from './useAuth';

export const useCanPlay = (questionsPerRequest: number = 1, gameMode: GameMode = GameMode.QUESTION_LIMITED) => {
	const { data: creditBalance } = useCreditBalance();
	const userRole = useUserRole();

	// Admin users can always play without credits
	if (userRole === UserRole.ADMIN) {
		return {
			data: true,
			isLoading: false,
			error: null,
			refetch: () => {},
		};
	}

	// Calculate required credits based on game mode (uses new methodology)
	// TIME_LIMITED = 10 fixed, QUESTION_LIMITED/UNLIMITED/MULTIPLAYER = 1 per question
	const requiredCredits = calculateRequiredCredits(questionsPerRequest, gameMode);

	// Check if user has free questions available (free questions cover the required credits)
	const canPlayFree = creditBalance?.canPlayFree ?? false;
	const hasFreeQuestions = canPlayFree && (creditBalance?.freeQuestions ?? 0) >= requiredCredits;

	// Calculate if user can play based on React Query state
	const canPlay = hasFreeQuestions || (creditBalance?.totalCredits ?? 0) >= requiredCredits;

	return {
		data: canPlay,
		isLoading: false,
		error: null,
		refetch: () => {}, // No need to refetch from API
	};
};

export const useDeductCredits = () => {
	const queryClient = useQueryClient();
	const userRole = useUserRole();

	return useMutation({
		mutationFn: ({ questionsPerRequest, gameMode }: DeductCreditsParams) =>
			creditsService.deductCredits(questionsPerRequest, gameMode ?? GameMode.QUESTION_LIMITED),
		onMutate: async ({ questionsPerRequest, gameMode }: DeductCreditsParams) => {
			// Skip optimistic update for admin users (server handles it)
			if (userRole === UserRole.ADMIN) {
				return { previousBalance: queryClient.getQueryData(QUERY_KEYS.credits.balance()) };
			}
			// Cancel any outgoing refetches
			try {
				await queryClient.cancelQueries({ queryKey: QUERY_KEYS.credits.balance() });
			} catch (error) {
				// Ignore errors when canceling queries
				// Use logger at a low level to avoid noise
				logger.apiDebug('Error canceling queries', {
					errorInfo: { message: getErrorMessage(error) },
				});
			}

			// Snapshot the previous value
			const previousBalance = queryClient.getQueryData(QUERY_KEYS.credits.balance());

			// Normalize game mode
			const normalizedGameMode = gameMode ?? GameMode.QUESTION_LIMITED;

			// Optimistically update the balance using shared deduction logic
			queryClient.setQueryData(QUERY_KEYS.credits.balance(), (old: unknown): CreditBalance => {
				// Simple type guard for CreditBalance
				const isCreditBalance = (value: unknown): value is CreditBalance => {
					return (
						typeof value === 'object' &&
						value !== null &&
						'totalCredits' in value &&
						'credits' in value &&
						'purchasedCredits' in value &&
						'freeQuestions' in value &&
						'dailyLimit' in value &&
						'canPlayFree' in value &&
						'nextResetTime' in value &&
						'userId' in value
					);
				};

				const current = isCreditBalance(old) ? old : undefined;
				if (!current) {
					return {
						totalCredits: 0,
						credits: 0,
						freeQuestions: 0,
						purchasedCredits: 0,
						dailyLimit: 0,
						canPlayFree: false,
						nextResetTime: new Date().toISOString(),
						userId: '',
					};
				}

				// Use shared deduction logic to ensure consistency with server
				const deductionResult = calculateNewBalance(current, questionsPerRequest, normalizedGameMode);
				return deductionResult.newBalance;
			});

			return { previousBalance };
		},
		onError: (_err, _variables, context) => {
			// Rollback on error
			if (context?.previousBalance) {
				queryClient.setQueryData(QUERY_KEYS.credits.balance(), context.previousBalance);
			}
		},
		onSettled: () => {
			// Always refetch after error or success to get latest balance from server
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.credits.all });
		},
	});
};

export const useCreditBalance = () => {
	const isAuthenticated = useIsAuthenticated();

	return useQuery({
		queryKey: QUERY_KEYS.credits.balance(),
		queryFn: () => creditsService.getCreditBalance(),
		staleTime: TIME_PERIODS_MS.HOUR,
		enabled: isAuthenticated, // Only fetch when user is authenticated
	});
};

export const useCreditPackages = () => {
	return useQuery({
		queryKey: QUERY_KEYS.credits.packages(),
		queryFn: () => creditsService.getCreditPackages(),
		staleTime: TIME_PERIODS_MS.HOUR,
	});
};

export const usePurchaseCredits = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (request: CreditsPurchaseRequest) => paymentService.purchaseCredits(request),
		onSuccess: () => {
			// Invalidate balance after purchase
			queryClient.invalidateQueries({ queryKey: QUERY_KEYS.credits.balance() });
		},
	});
};

export const usePaymentHistory = () => {
	const isAuthenticated = useIsAuthenticated();

	return useQuery<PaymentResult[]>({
		queryKey: QUERY_KEYS.credits.paymentHistory(),
		queryFn: () => paymentService.getPaymentHistory(),
		staleTime: TIME_PERIODS_MS.THIRTY_MINUTES,
		gcTime: TIME_PERIODS_MS.HOUR,
		enabled: isAuthenticated,
	});
};
