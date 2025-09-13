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
  /** Whether the slice is loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
}

/**
 * Loading action payload
 */
export interface LoadingPayload {
  /** Loading state */
  isLoading: boolean;
}

/**
 * Error action payload
 */
export interface ErrorPayload {
  /** Error message */
  error: string;
}

/**
 * Success action payload
 */
export interface SuccessPayload<T = Record<string, unknown>> {
  /** Success data */
  data: T;
}

/**
 * Async action states
 */
export type AsyncStateStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Async state with data
 */
export interface AsyncStateWithData<T = Record<string, unknown>> extends BaseReduxState {
  /** Current async state */
  status: AsyncStateStatus;
  /** Data payload */
  data: T | null;
}

// Use Points Return
export interface UsePointsReturn {
  /** Point balance */
  balance: number;
  /** Total points */
  total_points: number;
  /** Free questions */
  free_questions: number;
  /** Next reset time */
  next_reset_time: string | null;
  /** Points */
  points: number;
  /** Point balance */
  pointBalance: PointBalance | null;
  /** Add points */
  addPoints: (amount: number) => Promise<void>;
  /** Deduct points */
  deductPoints: (amount: number) => Promise<boolean>;
  /** Reset points */
  resetPoints: () => Promise<void>;
  /** Can play */
  canPlay: boolean;
  /** האם נטען */
  isLoading: boolean;
  /** שגיאה */
  error: string | null;
  /** רכישת נקודות */
  purchasePoints: (amount: number) => Promise<void>;
  /** שימוש בנקודות */
  usePoints: (amount: number) => Promise<boolean>;
  /** Refresh balance */
  refreshBalance: () => Promise<void>;
}
