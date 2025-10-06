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
  playSound: (soundName: string) => void;
  preloadAudio: (audioKey: string, path: string) => Promise<void>;
  stopSound: (soundName: string) => void;
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

/**
 * Category Volume Control Props
 * @interface CategoryVolumeControlProps
 * @description Props for individual audio category volume controls
 */
export interface CategoryVolumeControlProps {
  category: AudioCategory;
  volume: number;
  onVolumeChange: (category: AudioCategory, volume: number) => void;
  className?: string;
}

/**
 * Countdown Sounds Control Props
 * @interface CountdownSoundsProps
 * @description Props for countdown sound toggle component
 */
export interface CountdownSoundsProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}
