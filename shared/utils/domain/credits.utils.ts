/**
 * Credits Utilities (pure functions, browser-safe)
 *
 * @module CreditsUtils
 * @description A set of pure utility functions for credits calculations that can be safely used
 * @used_by both client (browser) and server (Node). No NestJS or platform-specific deps.
 */
import { GameMode } from '@shared/constants';

/**
 * Calculate required credits for a game session
 * @param requestedQuestions Number of questions requested
 * @param gameMode Game mode (affects credit cost)
 * @returns Required credits
 * @description Client-side version that matches server-side calculation logic.
 * Server should use BaseCreditsService.calculateRequiredCredits().
 */
export function calculateRequiredCredits(requestedQuestions: number, gameMode: GameMode): number {
	let costPerQuestion = 1;

	switch (gameMode) {
		case GameMode.TIME_LIMITED:
			costPerQuestion = 1.5;
			break;
		case GameMode.QUESTION_LIMITED:
			costPerQuestion = 1;
			break;
		case GameMode.UNLIMITED:
			costPerQuestion = 0.8;
			break;
		default:
			costPerQuestion = 1;
	}

	return Math.ceil(requestedQuestions * costPerQuestion);
}
