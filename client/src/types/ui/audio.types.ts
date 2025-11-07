/**
 * Audio Types
 * @module AudioTypes
 * @description Audio-related types and interfaces
 */
import type { AudioKey } from '../../constants';

/**
 * Audio Service Interface
 * @interface AudioServiceInterface
 * @description Core interface for audio management throughout the application
 */
export interface AudioServiceInterface {
	isEnabled: boolean;
	volume: number;
	toggleAudio: () => void;
	setVolume: (volume: number) => void;
	playSound: (soundName: AudioKey) => void;
	preloadAudio: (audioKey: AudioKey, path: string) => Promise<void>;
	stopSound: (soundName: AudioKey) => void;
	stopAllSounds: () => void;
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
