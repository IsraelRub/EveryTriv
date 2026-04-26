import { Infinity, ListOrdered, Timer, Users, type LucideIcon } from 'lucide-react';

import { GameMode } from '@shared/constants';

import { GameKey } from '../core/ui/localeKeys.constants';

export interface GameModePresentation {
	readonly icon: LucideIcon;
	readonly nameKey: GameKey;
	readonly descKey: GameKey;
	readonly showQuestionLimit: boolean;
	readonly showTimeLimit: boolean;
}

export const GAME_MODE_PRESENTATION: Record<GameMode, GameModePresentation> = {
	[GameMode.QUESTION_LIMITED]: {
		icon: ListOrdered,
		nameKey: GameKey.MODE_QUESTION_LIMITED,
		descKey: GameKey.MODE_QUESTION_LIMITED_DESCRIPTION,
		showQuestionLimit: true,
		showTimeLimit: false,
	},
	[GameMode.TIME_LIMITED]: {
		icon: Timer,
		nameKey: GameKey.MODE_TIME_LIMITED,
		descKey: GameKey.MODE_TIME_LIMITED_DESCRIPTION,
		showQuestionLimit: false,
		showTimeLimit: true,
	},
	[GameMode.UNLIMITED]: {
		icon: Infinity,
		nameKey: GameKey.MODE_UNLIMITED,
		descKey: GameKey.MODE_UNLIMITED_DESCRIPTION,
		showQuestionLimit: false,
		showTimeLimit: false,
	},
	[GameMode.MULTIPLAYER]: {
		icon: Users,
		nameKey: GameKey.MULTIPLAYER,
		descKey: GameKey.COMPETE_WITH_FRIENDS,
		showQuestionLimit: false,
		showTimeLimit: false,
	},
} as const;

export const SINGLE_PLAYER_SETUP_GAME_MODES_ORDER: readonly GameMode[] = [
	GameMode.QUESTION_LIMITED,
	GameMode.TIME_LIMITED,
	GameMode.UNLIMITED,
] as const;
