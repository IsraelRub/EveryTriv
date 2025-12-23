/**
 * Routing Utilities
 *
 * @module RoutingUtils
 * @description Utility functions for routing and navigation
 * @used_by client/src/hooks, client/src/components/routing
 */
import { isRecord } from '@shared/utils';

import type { GameSummaryNavigationState, ModalRouteState } from '@/types';

/**
 * Type guard for ModalRouteState
 * @param value Value to check
 * @returns True if value is ModalRouteState
 */
export function isModalRouteState(value: unknown): value is ModalRouteState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		(value.modal === undefined || typeof value.modal === 'boolean') &&
		(value.returnUrl === undefined || typeof value.returnUrl === 'string')
	);
}

/**
 * Type guard for GameSummaryNavigationState
 * @param value Value to check
 * @returns True if value is GameSummaryNavigationState
 */
export function isGameSummaryNavigationState(value: unknown): value is GameSummaryNavigationState {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.userId === 'string' &&
		typeof value.score === 'number' &&
		Number.isFinite(value.score) &&
		typeof value.gameQuestionCount === 'number' &&
		Number.isFinite(value.gameQuestionCount) &&
		typeof value.correctAnswers === 'number' &&
		Number.isFinite(value.correctAnswers) &&
		typeof value.timeSpent === 'number' &&
		Number.isFinite(value.timeSpent) &&
		Array.isArray(value.questionsData) &&
		(value.difficulty === undefined || typeof value.difficulty === 'string') &&
		(value.topic === undefined || typeof value.topic === 'string')
	);
}
