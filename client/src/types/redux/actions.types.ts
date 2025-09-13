/**
 * Redux Action Types
 * @module ReduxActionTypes
 * @description Redux action payload types
 */
import { ErrorPayload,LoadingPayload } from './async.types';

// Common Action Types
export interface CommonActionPayloads {
  loading: LoadingPayload;
  error: ErrorPayload;
  clearError: void;
  reset: void;
}

// Action Payload Types
export interface FavoritePayload {
  /** סוג הפריט */
  type: 'topic' | 'difficulty' | 'game';
  /** ערך הפריט */
  value: string;
  /** פעולה */
  action: 'add' | 'remove' | 'toggle';
  /** נושא */
  topic?: string;
  /** קושי */
  difficulty?: string;
}

export interface PointBalancePayload {
  /** יתרת נקודות */
  balance: number;
  /** נקודות שנרכשו */
  purchasedPoints: number;
  /** נקודות חינם */
  freePoints: number;
  /** זמן עדכון */
  lastUpdated: Date;
  /** נקודות */
  points?: number;
}

export interface ScoreUpdatePayload {
  /** ניקוד חדש */
  score: number;
  /** זמן נוסף */
  timeSpent: number;
  /** תשובה נכונה */
  isCorrect: boolean;
  /** זמן תגובה */
  responseTime: number;
  /** תשובה נכונה (alias) */
  correct?: boolean;
  /** זמן כולל */
  totalTime?: number;
}
