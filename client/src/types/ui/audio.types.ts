/**
 * Audio Types
 * @module AudioTypes
 * @description Audio-related types and interfaces
 */
import { AudioCategory } from '../../constants';

// Browser-specific audio interfaces
export interface WindowWithWebkitAudio extends Window {
	webkitAudioContext?: typeof AudioContext;
}

// Audio Service Interface
export interface AudioServiceInterface {
	isEnabled: boolean;
	volume: number;
	toggleAudio: () => void;
	setVolume: (volume: number) => void;
	playSound: (soundName: string) => void;
	preloadAudio: (audioKey: string, path: string) => Promise<void>;
	stopSound: (soundName: string) => void;
	stopAllSounds: () => void;
}

// Audio Controls Props
export interface AudioControlsProps {
	/** Audio service instance - optional when using Context */
	audioService?: AudioServiceInterface;
	/** Additional CSS classes */
	className?: string;
	/** Whether to show volume slider */
	showVolumeSlider?: boolean;
	/** Whether to show category controls */
	showCategoryControls?: boolean;
}

// Category Volume Control Props
export interface CategoryVolumeControlProps {
	/** Audio category */
	category: AudioCategory;
	/** Current volume for this category */
	volume: number;
	/** Volume change handler */
	onVolumeChange: (category: AudioCategory, volume: number) => void;
	/** Additional CSS classes */
	className?: string;
}

// Countdown Sounds Props
export interface CountdownSoundsProps {
	/** Whether countdown sounds are enabled */
	enabled: boolean;
	/** Countdown sound change handler */
	onToggle: (enabled: boolean) => void;
	/** Additional CSS classes */
	className?: string;
}
