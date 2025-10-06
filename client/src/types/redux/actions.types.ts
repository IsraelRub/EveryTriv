/**
 * Redux Action Types
 * @module ReduxActionTypes
 * @description Redux action payload types
 */
import { ErrorPayload, LoadingPayload } from './async.types';

// Common Action Types
export interface CommonActionPayloads {
  loading: LoadingPayload;
  error: ErrorPayload;
  clearError: void;
  reset: void;
}

// Action Payload Types
export interface FavoritePayload {
  type: 'topic' | 'difficulty' | 'game';
  value: string;
  action: 'add' | 'remove' | 'toggle';
  topic?: string;
  difficulty?: string;
}

export interface PointBalancePayload {
  balance: number;
  purchasedPoints: number;
  freePoints: number;
  lastUpdated: Date;
  points?: number;
}

export interface ScoreUpdatePayload {
  score: number;
  timeSpent: number;
  isCorrect: boolean;
  responseTime: number;
  correct?: boolean;
  totalTime?: number;
}
