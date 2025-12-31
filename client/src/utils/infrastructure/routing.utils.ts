/**
 * Routing Utilities
 *
 * @module RoutingUtils
 * @description Utility functions for routing and navigation
 * @used_by client/src/hooks, client/src/components/routing
 */
import { defaultValidators } from '@shared/constants';
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
		(value.modal === undefined || defaultValidators.boolean(value.modal)) &&
		(value.returnUrl === undefined || defaultValidators.string(value.returnUrl))
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
		defaultValidators.string(value.userId) &&
		defaultValidators.number(value.score) &&
		defaultValidators.number(value.gameQuestionCount) &&
		defaultValidators.number(value.correctAnswers) &&
		defaultValidators.number(value.timeSpent) &&
		Array.isArray(value.questionsData) &&
		(value.difficulty === undefined || defaultValidators.string(value.difficulty)) &&
		(value.topic === undefined || defaultValidators.string(value.topic))
	);
}
