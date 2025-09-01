export enum AudioCategory {
	UI = 'UI',
	GAME = 'GAME',
	MUSIC = 'MUSIC',
	EFFECTS = 'EFFECTS',
	GAMEPLAY = 'GAMEPLAY',
	ACHIEVEMENT = 'ACHIEVEMENT',
}

/**
 * Audio constants for EveryTriv client
 * Defines audio keys, paths, categories, and configurations
 */
export enum AudioKey {
	// UI Sounds
	BUTTON_CLICK = 'BUTTON_CLICK',
	HOVER = 'HOVER',
	SUCCESS = 'SUCCESS',
	ERROR = 'ERROR',
	WARNING = 'WARNING',
	NOTIFICATION = 'NOTIFICATION',
	CLICK = 'CLICK',
	SWIPE = 'SWIPE',
	POP = 'POP',
	INPUT = 'INPUT',
	PAGE_CHANGE = 'PAGE_CHANGE',
	MENU_OPEN = 'MENU_OPEN',
	MENU_CLOSE = 'MENU_CLOSE',

	// Game Sounds
	CORRECT_ANSWER = 'CORRECT_ANSWER',
	WRONG_ANSWER = 'WRONG_ANSWER',
	GAME_START = 'GAME_START',
	GAME_END = 'GAME_END',
	TIME_WARNING = 'TIME_WARNING',
	COUNTDOWN = 'COUNTDOWN',
	ACHIEVEMENT = 'ACHIEVEMENT',
	NEW_ACHIEVEMENT = 'NEW_ACHIEVEMENT',
	LEVEL_UP = 'LEVEL_UP',
	POINT_STREAK = 'POINT_STREAK',
	POINT_EARNED = 'POINT_EARNED',

	// Background Music
	BACKGROUND_MUSIC = 'BACKGROUND_MUSIC',
	MENU_MUSIC = 'MENU_MUSIC',
	GAME_MUSIC = 'GAME_MUSIC',
}

export const DEFAULT_CATEGORY_VOLUMES: Record<AudioCategory, number> = {
	[AudioCategory.UI]: 0.7,
	[AudioCategory.GAME]: 0.8,
	[AudioCategory.MUSIC]: 0.5,
	[AudioCategory.EFFECTS]: 0.6,
	[AudioCategory.GAMEPLAY]: 0.8,
	[AudioCategory.ACHIEVEMENT]: 0.9,
};

export const AUDIO_CATEGORIES: Record<AudioKey, AudioCategory> = {
	[AudioKey.BUTTON_CLICK]: AudioCategory.UI,
	[AudioKey.HOVER]: AudioCategory.UI,
	[AudioKey.SUCCESS]: AudioCategory.UI,
	[AudioKey.ERROR]: AudioCategory.UI,
	[AudioKey.WARNING]: AudioCategory.UI,
	[AudioKey.NOTIFICATION]: AudioCategory.UI,
	[AudioKey.CLICK]: AudioCategory.UI,
	[AudioKey.SWIPE]: AudioCategory.UI,
	[AudioKey.POP]: AudioCategory.UI,
	[AudioKey.INPUT]: AudioCategory.UI,
	[AudioKey.PAGE_CHANGE]: AudioCategory.UI,
	[AudioKey.MENU_OPEN]: AudioCategory.UI,
	[AudioKey.MENU_CLOSE]: AudioCategory.UI,

	[AudioKey.CORRECT_ANSWER]: AudioCategory.GAME,
	[AudioKey.WRONG_ANSWER]: AudioCategory.GAME,
	[AudioKey.GAME_START]: AudioCategory.GAME,
	[AudioKey.GAME_END]: AudioCategory.GAME,
	[AudioKey.TIME_WARNING]: AudioCategory.GAME,
	[AudioKey.COUNTDOWN]: AudioCategory.GAME,
	[AudioKey.ACHIEVEMENT]: AudioCategory.GAME,
	[AudioKey.NEW_ACHIEVEMENT]: AudioCategory.ACHIEVEMENT,
	[AudioKey.LEVEL_UP]: AudioCategory.ACHIEVEMENT,
	[AudioKey.POINT_STREAK]: AudioCategory.GAMEPLAY,
	[AudioKey.POINT_EARNED]: AudioCategory.GAMEPLAY,

	[AudioKey.BACKGROUND_MUSIC]: AudioCategory.MUSIC,
	[AudioKey.MENU_MUSIC]: AudioCategory.MUSIC,
	[AudioKey.GAME_MUSIC]: AudioCategory.MUSIC,
};

export const AUDIO_PATHS: Record<AudioKey, string> = {
	[AudioKey.BUTTON_CLICK]: '/sounds/ui/button-click.mp3',
	[AudioKey.HOVER]: '/sounds/ui/hover.mp3',
	[AudioKey.SUCCESS]: '/sounds/ui/success.mp3',
	[AudioKey.ERROR]: '/sounds/ui/error.mp3',
	[AudioKey.WARNING]: '/sounds/ui/warning.mp3',
	[AudioKey.NOTIFICATION]: '/sounds/ui/notification.mp3',
	[AudioKey.CLICK]: '/sounds/ui/click.mp3',
	[AudioKey.SWIPE]: '/sounds/ui/swipe.mp3',
	[AudioKey.POP]: '/sounds/ui/pop.mp3',
	[AudioKey.INPUT]: '/sounds/ui/input.mp3',
	[AudioKey.PAGE_CHANGE]: '/sounds/ui/page-change.mp3',
	[AudioKey.MENU_OPEN]: '/sounds/ui/menu-open.mp3',
	[AudioKey.MENU_CLOSE]: '/sounds/ui/menu-close.mp3',

	[AudioKey.CORRECT_ANSWER]: '/sounds/game/correct.mp3',
	[AudioKey.WRONG_ANSWER]: '/sounds/game/wrong.mp3',
	[AudioKey.GAME_START]: '/sounds/game/start.mp3',
	[AudioKey.GAME_END]: '/sounds/game/end.mp3',
	[AudioKey.TIME_WARNING]: '/sounds/game/time-warning.mp3',
	[AudioKey.COUNTDOWN]: '/sounds/game/countdown.mp3',
	[AudioKey.ACHIEVEMENT]: '/sounds/game/achievement.mp3',
	[AudioKey.NEW_ACHIEVEMENT]: '/sounds/game/new-achievement.mp3',
	[AudioKey.LEVEL_UP]: '/sounds/game/level-up.mp3',
	[AudioKey.POINT_STREAK]: '/sounds/game/point-streak.mp3',
	[AudioKey.POINT_EARNED]: '/sounds/game/point-earned.mp3',

	[AudioKey.BACKGROUND_MUSIC]: '/sounds/music/background.mp3',
	[AudioKey.MENU_MUSIC]: '/sounds/music/menu.mp3',
	[AudioKey.GAME_MUSIC]: '/sounds/music/game.mp3',
};

export const AUDIO_CONFIG: Record<AudioKey, { volume?: number; loop?: boolean }> = {
	[AudioKey.BUTTON_CLICK]: { volume: 0.5, loop: false },
	[AudioKey.HOVER]: { volume: 0.3, loop: false },
	[AudioKey.SUCCESS]: { volume: 0.7, loop: false },
	[AudioKey.ERROR]: { volume: 0.7, loop: false },
	[AudioKey.WARNING]: { volume: 0.6, loop: false },
	[AudioKey.NOTIFICATION]: { volume: 0.5, loop: false },
	[AudioKey.CLICK]: { volume: 0.4, loop: false },
	[AudioKey.SWIPE]: { volume: 0.3, loop: false },
	[AudioKey.POP]: { volume: 0.4, loop: false },
	[AudioKey.INPUT]: { volume: 0.3, loop: false },
	[AudioKey.PAGE_CHANGE]: { volume: 0.4, loop: false },
	[AudioKey.MENU_OPEN]: { volume: 0.4, loop: false },
	[AudioKey.MENU_CLOSE]: { volume: 0.4, loop: false },

	[AudioKey.CORRECT_ANSWER]: { volume: 0.8, loop: false },
	[AudioKey.WRONG_ANSWER]: { volume: 0.7, loop: false },
	[AudioKey.GAME_START]: { volume: 0.6, loop: false },
	[AudioKey.GAME_END]: { volume: 0.7, loop: false },
	[AudioKey.TIME_WARNING]: { volume: 0.8, loop: false },
	[AudioKey.COUNTDOWN]: { volume: 0.7, loop: false },
	[AudioKey.ACHIEVEMENT]: { volume: 0.9, loop: false },
	[AudioKey.NEW_ACHIEVEMENT]: { volume: 0.9, loop: false },
	[AudioKey.LEVEL_UP]: { volume: 0.8, loop: false },
	[AudioKey.POINT_STREAK]: { volume: 0.7, loop: false },
	[AudioKey.POINT_EARNED]: { volume: 0.6, loop: false },

	[AudioKey.BACKGROUND_MUSIC]: { volume: 0.3, loop: true },
	[AudioKey.MENU_MUSIC]: { volume: 0.4, loop: true },
	[AudioKey.GAME_MUSIC]: { volume: 0.3, loop: true },
};
