import type { AudioData } from '@/types';

export enum AudioCategory {
	FEEDBACK = 'FEEDBACK',
	MUSIC = 'MUSIC',
	GAMEPLAY = 'GAMEPLAY',
}

export enum AudioKey {
	// Feedback Sounds
	BUTTON_CLICK = 'BUTTON_CLICK',
	SUCCESS = 'SUCCESS',
	ERROR = 'ERROR',
	WARNING = 'WARNING',
	NOTIFICATION = 'NOTIFICATION',
	INPUT = 'INPUT',
	PAGE_CHANGE = 'PAGE_CHANGE',
	DIALOG_CLOSE = 'DIALOG_CLOSE',

	// Game Sounds
	CORRECT_ANSWER = 'CORRECT_ANSWER',
	WRONG_ANSWER = 'WRONG_ANSWER',
	GAME_START = 'GAME_START',
	GAME_END = 'GAME_END',
	TIME_WARNING = 'TIME_WARNING',
	STAR_APPEAR = 'STAR_APPEAR',

	// Background Music
	BACKGROUND_MUSIC = 'BACKGROUND_MUSIC',
	GAME_MUSIC = 'GAME_MUSIC',
}

const feedback = { category: AudioCategory.FEEDBACK, loop: false, basePath: '/assets/sounds/feedback/', volume: 0.4 };
const gameplay = { category: AudioCategory.GAMEPLAY, loop: false, basePath: '/assets/sounds/gameplay/', volume: 0.7 };
const gameEndSoundsPath = '/assets/sounds/achievement/';
const music = { category: AudioCategory.MUSIC, loop: true, basePath: '/assets/sounds/music/', volume: 0.3 };

export const AUDIO_DATA: Record<AudioKey, AudioData> = {
	// Feedback
	[AudioKey.BUTTON_CLICK]: { ...feedback, path: `${feedback.basePath}click.wav` },
	[AudioKey.SUCCESS]: { ...feedback, path: `${feedback.basePath}beep.wav` },
	[AudioKey.ERROR]: { ...feedback, path: `${feedback.basePath}error.wav` },
	[AudioKey.WARNING]: { ...feedback, path: `${feedback.basePath}warning.wav` },
	[AudioKey.NOTIFICATION]: { ...feedback, path: `${feedback.basePath}beep.wav` },
	[AudioKey.INPUT]: { ...feedback, path: `${feedback.basePath}click.wav` },
	[AudioKey.PAGE_CHANGE]: { ...feedback, path: `${feedback.basePath}swipe.wav` },
	[AudioKey.DIALOG_CLOSE]: { ...feedback, path: `${feedback.basePath}menu-close.wav` },

	// GAMEPLAY
	[AudioKey.CORRECT_ANSWER]: { ...gameplay, path: `${gameplay.basePath}correct-answer.wav` },
	[AudioKey.WRONG_ANSWER]: { ...gameplay, path: `${gameplay.basePath}wrong-answer.wav` },
	[AudioKey.GAME_START]: { ...gameplay, path: `${gameplay.basePath}whoosh.wav` },
	[AudioKey.GAME_END]: { ...gameplay, path: `${gameEndSoundsPath}win.wav` },
	[AudioKey.TIME_WARNING]: { ...gameplay, path: `${gameplay.basePath}pop.wav` },
	[AudioKey.STAR_APPEAR]: { ...gameplay, path: `${gameEndSoundsPath}achievement.wav` },

	// MUSIC
	[AudioKey.BACKGROUND_MUSIC]: { ...music, path: `${music.basePath}general.mp3` },
	[AudioKey.GAME_MUSIC]: { ...music, path: `${music.basePath}game.mp3` },
};
