import type { AudioData } from '@/types';

export enum AudioCategory {
	FEEDBACK = 'FEEDBACK',
	MUSIC = 'MUSIC',
	GAMEPLAY = 'GAMEPLAY',
	ACHIEVEMENT = 'ACHIEVEMENT',
}

export enum AudioKey {
	// Feedback Sounds
	BUTTON_CLICK = 'BUTTON_CLICK',
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
	SCORE_STREAK = 'SCORE_STREAK',
	SCORE_EARNED = 'SCORE_EARNED',

	// Background Music
	BACKGROUND_MUSIC = 'BACKGROUND_MUSIC',
	GAME_MUSIC = 'GAME_MUSIC',
}

const feedback = { category: AudioCategory.FEEDBACK, loop: false, basePath: '/assets/sounds/feedback/', volume: 0.4 };
const gameplay = { category: AudioCategory.GAMEPLAY, loop: false, basePath: '/assets/sounds/gameplay/', volume: 0.7 };
const achievement = {
	category: AudioCategory.ACHIEVEMENT,
	loop: false,
	basePath: '/assets/sounds/achievement/',
	volume: 0.8,
};
const music = { category: AudioCategory.MUSIC, loop: true, basePath: '/assets/sounds/music/', volume: 0.3 };

export const AUDIO_DATA: Record<AudioKey, AudioData> = {
	// Feedback
	[AudioKey.BUTTON_CLICK]: { ...feedback, path: `${feedback.basePath}click.wav` },
	[AudioKey.SUCCESS]: { ...feedback, path: `${feedback.basePath}pop.wav` },
	[AudioKey.ERROR]: { ...feedback, path: `${feedback.basePath}error.wav` },
	[AudioKey.WARNING]: { ...feedback, path: `${feedback.basePath}warning.wav` },
	[AudioKey.NOTIFICATION]: { ...feedback, path: `${feedback.basePath}pop.wav` },
	[AudioKey.CLICK]: { ...feedback, path: `${feedback.basePath}click.wav` },
	[AudioKey.SWIPE]: { ...feedback, path: `${feedback.basePath}swipe.wav` },
	[AudioKey.POP]: { ...feedback, path: `${feedback.basePath}pop.wav` },
	[AudioKey.INPUT]: { ...feedback, path: `${feedback.basePath}click.wav` },
	[AudioKey.PAGE_CHANGE]: { ...feedback, path: `${feedback.basePath}whoosh.wav` },
	[AudioKey.MENU_OPEN]: { ...feedback, path: `${feedback.basePath}whoosh.wav` },
	[AudioKey.MENU_CLOSE]: { ...feedback, path: `${feedback.basePath}menu-close.wav` },

	// GAMEPLAY
	[AudioKey.CORRECT_ANSWER]: { ...gameplay, path: `${gameplay.basePath}correct-answer.wav` },
	[AudioKey.WRONG_ANSWER]: { ...gameplay, path: `${gameplay.basePath}wrong-answer.wav` },
	[AudioKey.GAME_START]: { ...gameplay, path: `${gameplay.basePath}whoosh.wav` },
	[AudioKey.GAME_END]: { ...gameplay, path: `${gameplay.basePath}pop.wav` },
	[AudioKey.TIME_WARNING]: { ...gameplay, path: `${gameplay.basePath}beep.wav` },
	[AudioKey.COUNTDOWN]: { ...gameplay, path: `${gameplay.basePath}beep.wav` },

	// ACHIEVEMENT
	[AudioKey.ACHIEVEMENT]: { ...achievement, path: `${achievement.basePath}achievement.wav` },
	[AudioKey.NEW_ACHIEVEMENT]: { ...achievement, path: `${achievement.basePath}win.wav` },
	[AudioKey.LEVEL_UP]: { ...achievement, path: `${achievement.basePath}level-up.wav` },
	[AudioKey.SCORE_STREAK]: { ...achievement, path: `${achievement.basePath}streak.wav` },
	[AudioKey.SCORE_EARNED]: { ...achievement, path: `${achievement.basePath}click.wav` },

	// MUSIC
	[AudioKey.BACKGROUND_MUSIC]: { ...music, path: `${music.basePath}general.mp3` },
	[AudioKey.GAME_MUSIC]: { ...music, path: `${music.basePath}game.mp3` },
};
