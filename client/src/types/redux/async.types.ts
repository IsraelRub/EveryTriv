/**
 * Async Types
 * @module AsyncTypes
 * @description Async operation types for Redux
 */
import type { PointBalance } from '../points.types';

/**
 * Base state interface for all Redux slices
 */
export interface BaseReduxState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Loading action payload
 */
export interface LoadingPayload {
  isLoading: boolean;
}

/**
 * Error action payload
 */
export interface ErrorPayload {
  error: string;
}

/**
 * Success action payload
 */
export interface SuccessPayload<T = Record<string, any>> {
  data: T;
}

/**
 * Async action states
 */
export type AsyncStateStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Async state with data
 */
export interface AsyncStateWithData<T = Record<string, any>> extends BaseReduxState {
  status: AsyncStateStatus;
  data: T | null;
}

export interface UsePointsReturn {
  balance: number;
  total_points: number;
  free_questions: number;
  next_reset_time: string | null;
  points: number;
  pointBalance: PointBalance | null;
  addPoints: (amount: number) => Promise<void>;
  deductPoints: (amount: number) => Promise<boolean>;
  resetPoints: () => Promise<void>;
  canPlay: boolean;
  isLoading: boolean;
  error: string | null;
  purchasePoints: (amount: number) => Promise<void>;
  usePoints: (amount: number) => Promise<boolean>;
  refreshBalance: () => Promise<void>;
}
