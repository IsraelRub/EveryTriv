import { GAME_MODES, GameMode } from '@shared/constants';

export function validateGameMode(gameMode: string): boolean {
	return GAME_MODES.has(gameMode);
}

export function normalizeGameMode(gameMode: string | undefined): GameMode | undefined {
	if (!gameMode) {
		return undefined;
	}
	if (GAME_MODES.has(gameMode)) {
		if (gameMode === GameMode.QUESTION_LIMITED) return GameMode.QUESTION_LIMITED;
		if (gameMode === GameMode.TIME_LIMITED) return GameMode.TIME_LIMITED;
		if (gameMode === GameMode.UNLIMITED) return GameMode.UNLIMITED;
		if (gameMode === GameMode.MULTIPLAYER) return GameMode.MULTIPLAYER;
	}
	return undefined;
}
