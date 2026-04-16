import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { GameMode, TIME_PERIODS_MS } from '@shared/constants';
import type { CreditBalance, CreditsPurchaseRequest, PaymentResult } from '@shared/types';
import { calculateNewBalance, calculateRequiredCredits, getErrorMessage, isRecord } from '@shared/utils';

import { QUERY_KEYS } from '@/constants';
import type { DeductCreditsParams } from '@/types';
import { creditsService, clientLogger as logger, paymentService, queryInvalidationService } from '@/services';
import { useIsAuthenticated, useUserRole } from './useAuth';

export const useCanPlay = (questionsPerRequest: number = 1, gameMode: GameMode = GameMode.QUESTION_LIMITED) => {
	const { data: creditBalance } = useCreditBalance();
	const { isAdmin } = useUserRole();

	// Admin users can always play without credits
	if (isAdmin) {
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

	const canPlay = (creditBalance?.totalCredits ?? 0) >= requiredCredits;

	return {
		data: canPlay,
		isLoading: false,
		error: null,
		refetch: () => {},
	};
};

export const useDeductCredits = () => {
	const queryClient = useQueryClient();
	const { isAdmin } = useUserRole();

	return useMutation({
		mutationFn: ({ questionsPerRequest, gameMode }: DeductCreditsParams) =>
			creditsService.deductCredits(questionsPerRequest, gameMode ?? GameMode.QUESTION_LIMITED),
		onMutate: async ({ questionsPerRequest, gameMode }: DeductCreditsParams) => {
			// Skip optimistic update for admin users (server handles it)
			if (isAdmin) {
				return { previousBalance: queryClient.getQueryData(QUERY_KEYS.credits.balance()) };
			}
			// Cancel any outgoing refetches
			try {
				await queryClient.cancelQueries({ queryKey: QUERY_KEYS.credits.balance() });
			} catch (error) {
				// Ignore errors when canceling queries
				// Use logger at a low level to avoid noise
				logger.userDebug('Credits mutation: cancelQueries failed (ignored)', {
					errorInfo: { message: getErrorMessage(error) },
				});
			}

			// Snapshot the previous value
			const previousBalance = queryClient.getQueryData(QUERY_KEYS.credits.balance());

			// Normalize game mode
			const normalizedGameMode = gameMode ?? GameMode.QUESTION_LIMITED;

			// Optimistically update the balance using shared deduction logic
			queryClient.setQueryData(
				QUERY_KEYS.credits.balance(),
				(old: unknown): CreditBalance => {
					// Simple type guard for CreditBalance
					const isCreditBalance = (value: unknown): value is CreditBalance => {
						return (
							isRecord(value) &&
							'totalCredits' in value &&
							'credits' in value &&
							'purchasedCredits' in value &&
							'nextGrantedCreditsRefillAt' in value &&
							'userId' in value
						);
					};

					const current = isCreditBalance(old) ? old : undefined;
					if (!current) {
						return {
							totalCredits: 0,
							credits: 0,
							purchasedCredits: 0,
							nextGrantedCreditsRefillAt: null,
							userId: '',
						};
					}

					// Use shared deduction logic to ensure consistency with server
					const deductionResult = calculateNewBalance(current, questionsPerRequest, normalizedGameMode);
					return deductionResult.newBalance;
				},
				{ updatedAt: Date.now() }
			);

			return { previousBalance };
		},
		onError: (error, variables, context) => {
			logger.userDebug('Rolling back credit balance after deduct failure', {
				errorInfo: { message: getErrorMessage(error) },
				gameMode: variables.gameMode,
				questionsPerRequest: variables.questionsPerRequest,
			});
			// Rollback on error (avoid onSettled invalidate here — it would refetch and fight the rollback window)
			if (context?.previousBalance) {
				queryClient.setQueryData(QUERY_KEYS.credits.balance(), context.previousBalance, {
					updatedAt: Date.now(),
				});
			}
		},
		onSuccess: async () => {
			try {
				await queryInvalidationService.invalidateCreditsQueries(queryClient);
			} catch (error) {
				logger.userDebug('invalidateCreditsQueries after deduct success failed', {
					errorInfo: { message: getErrorMessage(error) },
				});
			}
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
		refetchOnWindowFocus: true,
		refetchOnMount: 'always',
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
		onSuccess: async () => {
			try {
				await queryClient.cancelQueries({ queryKey: QUERY_KEYS.credits.balance() });
				await queryClient.cancelQueries({ queryKey: QUERY_KEYS.credits.paymentHistory() });
			} catch (error) {
				logger.userDebug('Purchase credits: cancelQueries before invalidate failed (ignored)', {
					errorInfo: { message: getErrorMessage(error) },
				});
			}
			await queryInvalidationService.invalidateCreditsQueries(queryClient);
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
		refetchOnWindowFocus: true,
		refetchOnMount: 'always',
	});
};
