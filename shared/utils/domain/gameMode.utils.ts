import { GameMode, VALID_GAME_MODES_SET } from '@shared/constants';

export function validateGameMode(gameMode: string): boolean {
	return VALID_GAME_MODES_SET.has(gameMode);
}

export function normalizeGameMode(gameMode: string | undefined): GameMode | undefined {
	if (!gameMode) {
		return undefined;
	}
	if (VALID_GAME_MODES_SET.has(gameMode)) {
		// Type narrowing: if gameMode is in VALID_GAME_MODES_SET, it must be a valid GameMode value
		if (gameMode === GameMode.QUESTION_LIMITED) {
			return GameMode.QUESTION_LIMITED;
		}
		if (gameMode === GameMode.TIME_LIMITED) {
			return GameMode.TIME_LIMITED;
		}
		if (gameMode === GameMode.UNLIMITED) {
			return GameMode.UNLIMITED;
		}
		if (gameMode === GameMode.MULTIPLAYER) {
			return GameMode.MULTIPLAYER;
		}
	}
	return undefined;
}
