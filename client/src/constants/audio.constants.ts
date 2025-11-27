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
	BEEP = 'BEEP',
	ACHIEVEMENT = 'ACHIEVEMENT',
	NEW_ACHIEVEMENT = 'NEW_ACHIEVEMENT',
	LEVEL_UP = 'LEVEL_UP',
	SCORE_STREAK = 'SCORE_STREAK',
	SCORE_EARNED = 'SCORE_EARNED',

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

	[AudioKey.CORRECT_ANSWER]: AudioCategory.GAMEPLAY,
	[AudioKey.WRONG_ANSWER]: AudioCategory.GAMEPLAY,
	[AudioKey.GAME_START]: AudioCategory.GAMEPLAY,
	[AudioKey.GAME_END]: AudioCategory.GAMEPLAY,
	[AudioKey.TIME_WARNING]: AudioCategory.GAMEPLAY,
	[AudioKey.COUNTDOWN]: AudioCategory.GAMEPLAY,
	[AudioKey.BEEP]: AudioCategory.GAMEPLAY,
	[AudioKey.ACHIEVEMENT]: AudioCategory.ACHIEVEMENT,
	[AudioKey.NEW_ACHIEVEMENT]: AudioCategory.ACHIEVEMENT,
	[AudioKey.LEVEL_UP]: AudioCategory.ACHIEVEMENT,
	[AudioKey.SCORE_STREAK]: AudioCategory.ACHIEVEMENT,
	[AudioKey.SCORE_EARNED]: AudioCategory.ACHIEVEMENT,

	[AudioKey.BACKGROUND_MUSIC]: AudioCategory.MUSIC,
	[AudioKey.MENU_MUSIC]: AudioCategory.MUSIC,
	[AudioKey.GAME_MUSIC]: AudioCategory.MUSIC,
};

export const AUDIO_PATHS: Record<AudioKey, string> = {
	// UI Sounds - use existing files efficiently
	[AudioKey.BUTTON_CLICK]: '/assets/sounds/ui/click.wav',
	[AudioKey.HOVER]: '/assets/sounds/ui/whoosh.wav',
	[AudioKey.SUCCESS]: '/assets/sounds/ui/pop.wav',
	[AudioKey.ERROR]: '/assets/sounds/ui/click.wav',
	[AudioKey.WARNING]: '/assets/sounds/ui/swipe.wav',
	[AudioKey.NOTIFICATION]: '/assets/sounds/ui/pop.wav',
	[AudioKey.CLICK]: '/assets/sounds/ui/click.wav',
	[AudioKey.SWIPE]: '/assets/sounds/ui/swipe.wav',
	[AudioKey.POP]: '/assets/sounds/ui/pop.wav',
	[AudioKey.INPUT]: '/assets/sounds/ui/click.wav',
	[AudioKey.PAGE_CHANGE]: '/assets/sounds/ui/whoosh.wav',
	[AudioKey.MENU_OPEN]: '/assets/sounds/ui/whoosh.wav',
	[AudioKey.MENU_CLOSE]: '/assets/sounds/ui/swipe.wav',

	// Game Sounds - use original gameplay sound files
	[AudioKey.CORRECT_ANSWER]: '/assets/sounds/gameplay/correct-answer.wav',
	[AudioKey.WRONG_ANSWER]: '/assets/sounds/gameplay/wrong-answer.wav',
	[AudioKey.GAME_START]: '/assets/sounds/ui/whoosh.wav',
	[AudioKey.GAME_END]: '/assets/sounds/ui/pop.wav',
	[AudioKey.TIME_WARNING]: '/assets/sounds/gameplay/beep.wav',
	[AudioKey.COUNTDOWN]: '/assets/sounds/gameplay/beep.wav',
	[AudioKey.BEEP]: '/assets/sounds/gameplay/beep.wav',
	[AudioKey.ACHIEVEMENT]: '/assets/sounds/achievements/win.wav',
	[AudioKey.NEW_ACHIEVEMENT]: '/assets/sounds/achievements/win.wav',
	[AudioKey.LEVEL_UP]: '/assets/sounds/achievements/win.wav',
	[AudioKey.SCORE_STREAK]: '/assets/sounds/ui/pop.wav',
	[AudioKey.SCORE_EARNED]: '/assets/sounds/ui/click.wav',

	// Background Music - use existing music files
	[AudioKey.BACKGROUND_MUSIC]: '/assets/sounds/music/general.mp3',
	[AudioKey.MENU_MUSIC]: '/assets/sounds/music/general.mp3',
	[AudioKey.GAME_MUSIC]: '/assets/sounds/music/game.mp3',
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
	[AudioKey.SCORE_STREAK]: { volume: 0.7, loop: false },
	[AudioKey.SCORE_EARNED]: { volume: 0.6, loop: false },
	[AudioKey.BEEP]: { volume: 0.5, loop: false },

	[AudioKey.BACKGROUND_MUSIC]: { volume: 0.3, loop: true },
	[AudioKey.MENU_MUSIC]: { volume: 0.4, loop: true },
	[AudioKey.GAME_MUSIC]: { volume: 0.3, loop: true },
};
