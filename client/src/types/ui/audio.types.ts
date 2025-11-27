/**
 * Audio Types
 * @module AudioTypes
 * @description Audio-related types and interfaces
 */
import type { ReactNode } from 'react';

import type { UserPreferences } from '@shared/types';

import type { AudioKey } from '../../constants';

/**
 * Audio Service Interface
 * @interface AudioServiceInterface
 * @description Core interface for audio management throughout the application
 */
export interface AudioServiceInterface {
	readonly isEnabled: boolean;
	readonly volume: number;
	setUserPreferences: (preferences: UserPreferences | null) => void;
	play: (key: AudioKey) => void;
	stop: (key: AudioKey) => void;
	stopAll: () => void;
	mute: () => void;
	unmute: () => void;
	toggleMute: () => boolean;
	setMasterVolume: (volume: number) => void;
	playAchievementSound: (score: number, total: number, previousScore: number) => void;
	setVolume: (volume: number) => void;
}

/**
 * Audio Controls Component Props
 * @interface AudioControlsProps
 * @description Props for the main audio controls component
 */
export interface AudioControlsProps {
	audioService?: AudioServiceInterface;
	className?: string;
	showVolumeSlider?: boolean;
	showCategoryControls?: boolean;
}

/**
 * Audio Provider Props
 * @interface AudioProviderProps
 * @description Props for the audio context provider component
 */
export interface AudioProviderProps {
	children: ReactNode;
	service?: AudioServiceInterface;
}
