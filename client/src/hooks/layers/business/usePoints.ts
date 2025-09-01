import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { deductPoints, setPointBalance } from '../../../redux/features/userSlice';
import { RootState } from '../../../redux/store';
import { loggerService, pointsService } from '../../../services/utils';
import { UsePointsReturn } from '../../../types';
import { useOperationTimer } from '../../contexts';
import { useAsync, useLocalStorage } from '../utils';

export function usePointsBusiness(): UsePointsReturn {
	const dispatch = useDispatch();
	const pointBalance = useSelector((state: RootState) => state.user.pointBalance);

	// Performance monitoring
	const { start, complete, error: errorOperation } = useOperationTimer('points-operation');

	// Local storage for offline support - convert string dates to Date objects
	const [, setOfflineBalance] = useLocalStorage('offline-point-balance', {
		...pointBalance,
		nextResetTime: pointBalance.next_reset_time ? new Date(pointBalance.next_reset_time) : null,
	});

	// Store functions in refs to avoid dependency issues
	const startRef = useRef(start);
	const completeRef = useRef(complete);
	const errorOperationRef = useRef(errorOperation);
	const dispatchRef = useRef(dispatch);
	const setOfflineBalanceRef = useRef(setOfflineBalance);

	// Update refs when functions change
	useEffect(() => {
		startRef.current = start;
		completeRef.current = complete;
		errorOperationRef.current = errorOperation;
		dispatchRef.current = dispatch;
		setOfflineBalanceRef.current = setOfflineBalance;
	}, [start, complete, errorOperation, dispatch, setOfflineBalance]);

	// Check if user can play a certain number of questions
	const canPlay = useCallback(
		(questionCount: number = 1): boolean => {
			return pointBalance.total_points >= questionCount || pointBalance.can_play_free;
		},
		[pointBalance.total_points, pointBalance.can_play_free]
	);

	// Memoize the refresh function to prevent infinite re-renders
	const refreshFunction = useCallback(async () => {
		startRef.current();
		try {
			const balance = await pointsService.getPointBalance();
			const balanceWithDate = {
				...balance,
				nextResetTime: balance.next_reset_time ? new Date(balance.next_reset_time) : null,
			};
			setOfflineBalanceRef.current(balanceWithDate);
			dispatchRef.current(
				setPointBalance({
					points: 0,
					balance: {
						...balance,
						next_reset_time: balance.next_reset_time || null,
					},
				})
			);
			completeRef.current();
			return balance;
		} catch (err) {
			errorOperationRef.current(`Failed to refresh balance: ${err}`);
			throw err;
		}
	}, []);

	// Async operations with caching and retry logic
	const [refreshState, refreshActions] = useAsync(refreshFunction, {
		cacheTime: 2 * 60 * 1000, // 2 minutes
		retryCount: 2,
		retryDelay: 1000,
		onError: err => {
			loggerService.userError('Failed to refresh point balance:', { error: err });
		},
	});

	// Deduct points function
	const deductPointsForGame = useCallback(
		async (questionCount: number = 1) => {
			try {
				startRef.current();

				if (!canPlay(questionCount)) {
					throw new Error(`Not enough points. Need ${questionCount}, have ${pointBalance.total_points}`);
				}

				// Optimistically update the local state
				dispatchRef.current(deductPoints(questionCount));

				// Send request to server
				const updatedBalance = await pointsService.deductPoints(questionCount, 'standard');

				// Update with server response to ensure consistency
				dispatchRef.current(
					setPointBalance({
						points: 0,
						balance: {
							...updatedBalance,
							next_reset_time: updatedBalance.next_reset_time || null,
						},
					})
				);

				completeRef.current();
				return updatedBalance;
			} catch (err) {
				errorOperationRef.current(`Failed to deduct points: ${err}`);
				throw err;
			}
		},
		[canPlay, pointBalance.total_points]
	);

	// Add points function
	const addPoints = useCallback(
		async (amount: number) => {
			try {
				startRef.current();

				// Optimistically update the local state
				dispatchRef.current(
					setPointBalance({
						points: amount,
						balance: {
							...pointBalance,
							total_points: pointBalance.total_points + amount,
							purchased_points: pointBalance.purchased_points + amount,
						},
					})
				);

				completeRef.current();
			} catch (err) {
				errorOperationRef.current(`Failed to add points: ${err}`);
				throw err;
			}
		},
		[pointBalance]
	);

	// Reset points function
	const resetPoints = useCallback(async () => {
		try {
			startRef.current();

			dispatchRef.current(
				setPointBalance({
					points: 0,
					balance: {
						...pointBalance,
						total_points: 0,
						free_questions: 0,
						purchased_points: 0,
					},
				})
			);

			completeRef.current();
		} catch (err) {
			errorOperationRef.current(`Failed to reset points: ${err}`);
			throw err;
		}
	}, [pointBalance]);

	// Auto-refresh balance on mount and when needed
	useEffect(() => {
		// refreshActions.execute(); // Commented out until execute is available
	}, [refreshActions]);

	return {
		points: pointBalance.total_points,
		addPoints,
		deductPoints: deductPointsForGame,
		resetPoints,
		canPlay,
		loading: refreshState.loading,
		error: refreshState.error?.message || null,
		pointBalance,
	};
}
