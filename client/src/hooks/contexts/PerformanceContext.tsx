import { createContext, ReactNode, useCallback, useContext, useMemo, useReducer } from 'react';

import { PerformanceAction, PerformanceContextType, PerformanceState } from '../../types';
import { PerformanceSettingsUpdate } from '../../types/ui.types';

// Initial state
const initialState: PerformanceState = {
	operations: new Map(),
	metrics: {
		totalOperations: 0,
		averageDuration: 0,
		slowOperations: [],
	},
	settings: {
		slowThreshold: 1000, // 1 second
		enableProfiling: true,
		maxOperations: 100,
	},
};

// Performance reducer
function performanceReducer(state: PerformanceState, action: PerformanceAction): PerformanceState {
	switch (action.type) {
		case 'START_OPERATION': {
			const newOperations = new Map(state.operations);
			newOperations.set(action.payload.id, {
				startTime: action.payload.startTime,
				duration: null,
				status: 'pending',
			});

			// Limit the number of stored operations
			if (newOperations.size > state.settings.maxOperations) {
				const firstKey = newOperations.keys().next().value;
				if (firstKey) {
					newOperations.delete(firstKey);
				}
			}

			return {
				...state,
				operations: newOperations,
				metrics: {
					...state.metrics,
					totalOperations: state.metrics.totalOperations + 1,
				},
			};
		}

		case 'COMPLETE_OPERATION': {
			const newOperations = new Map(state.operations);
			const operation = newOperations.get(action.payload.id);

			if (operation) {
				newOperations.set(action.payload.id, {
					...operation,
					duration: action.payload.duration,
					status: 'completed',
				});
			}

			// Recalculate metrics
			const completedOperations = Array.from(newOperations.values()).filter((op) => op.status === 'completed');
			const averageDuration =
				completedOperations.length > 0
					? completedOperations.reduce((sum, op) => sum + (op.duration || 0), 0) / completedOperations.length
					: 0;

			const slowOperations = Array.from(newOperations.entries())
				.filter(([_, op]) => op.status === 'completed' && (op.duration || 0) > state.settings.slowThreshold)
				.map(([id]) => id);

			return {
				...state,
				operations: newOperations,
				metrics: {
					...state.metrics,
					averageDuration,
					slowOperations,
				},
			};
		}

		case 'ERROR_OPERATION': {
			const newOperations = new Map(state.operations);
			const operation = newOperations.get(action.payload.id);

			if (operation) {
				newOperations.set(action.payload.id, {
					...operation,
					status: 'error',
					error: action.payload.error,
				});
			}

			return {
				...state,
				operations: newOperations,
			};
		}

		case 'CLEAR_OPERATION': {
			const newOperations = new Map(state.operations);
			newOperations.delete(action.payload.id);
			return {
				...state,
				operations: newOperations,
			};
		}

		case 'CLEAR_ALL_OPERATIONS': {
			return {
				...state,
				operations: new Map(),
				metrics: {
					totalOperations: 0,
					averageDuration: 0,
					slowOperations: [],
				},
			};
		}

		case 'UPDATE_SETTINGS': {
			return {
				...state,
				settings: {
					...state.settings,
					...action.payload,
				},
			};
		}

		default:
			return state;
	}
}

// Create context
const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

// Performance provider component
export function PerformanceProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(performanceReducer, initialState);

	const startOperation = useCallback(
		(id: string) => {
			if (!state.settings.enableProfiling) return;

			dispatch({
				type: 'START_OPERATION',
				payload: { id, startTime: performance.now() },
			});
		},
		[state.settings.enableProfiling]
	);

	const completeOperation = useCallback(
		(id: string) => {
			if (!state.settings.enableProfiling) return;

			const operation = state.operations.get(id);
			if (operation && operation.status === 'pending') {
				const duration = performance.now() - operation.startTime;
				dispatch({
					type: 'COMPLETE_OPERATION',
					payload: { id, duration },
				});
			}
		},
		[state.operations, state.settings.enableProfiling]
	);

	const errorOperation = useCallback(
		(id: string, error: string) => {
			if (!state.settings.enableProfiling) return;

			dispatch({
				type: 'ERROR_OPERATION',
				payload: { id, error },
			});
		},
		[state.settings.enableProfiling]
	);

	const clearOperation = useCallback((id: string) => {
		dispatch({
			type: 'CLEAR_OPERATION',
			payload: { id },
		});
	}, []);

	const clearAllOperations = useCallback(() => {
		dispatch({ type: 'CLEAR_ALL_OPERATIONS' });
	}, []);

	const updateSettings = useCallback((settings: PerformanceSettingsUpdate) => {
		dispatch({
			type: 'UPDATE_SETTINGS',
			payload: settings,
		});
	}, []);

	const isOperationSlow = useCallback(
		(id: string) => {
			const operation = state.operations.get(id);
			return (
				operation?.status === 'completed' &&
				operation.duration !== null &&
				operation.duration > state.settings.slowThreshold
			);
		},
		[state.operations, state.settings.slowThreshold]
	);

	const getOperationMetrics = useCallback(
		(id: string) => {
			return state.operations.get(id);
		},
		[state.operations]
	);

	const contextValue = useMemo(
		() => ({
			state,
			startOperation,
			completeOperation,
			errorOperation,
			clearOperation,
			clearAllOperations,
			updateSettings,
			isOperationSlow,
			getOperationMetrics,
		}),
		[
			state,
			startOperation,
			completeOperation,
			errorOperation,
			clearOperation,
			clearAllOperations,
			updateSettings,
			isOperationSlow,
			getOperationMetrics,
		]
	);

	return <PerformanceContext.Provider value={contextValue}>{children}</PerformanceContext.Provider>;
}

// Hook for measuring operation performance
export function useOperationTimer(operationId: string) {
	const { startOperation, completeOperation, errorOperation } = usePerformance();

	const start = useCallback(() => {
		startOperation(operationId);
	}, [operationId, startOperation]);

	const complete = useCallback(() => {
		completeOperation(operationId);
	}, [operationId, completeOperation]);

	const error = useCallback(
		(errorMessage: string) => {
			errorOperation(operationId, errorMessage);
		},
		[operationId, errorOperation]
	);

	return { start, complete, error };
}

// Hook to use performance context
export function usePerformance() {
	const context = useContext(PerformanceContext);
	if (context === undefined) {
		throw new Error('usePerformance must be used within a PerformanceProvider');
	}
	return context;
}
