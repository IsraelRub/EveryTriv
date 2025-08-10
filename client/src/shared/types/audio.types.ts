/**
 * Audio-related types for EveryTriv
 */

import { AudioKey, AudioCategory } from '../constants/audio.constants';

// Audio configuration types
export interface AudioConfig {
  volume?: number;
  loop?: boolean;
}

// Audio context type
export interface AudioContextType {
  playSound: (key: AudioKey) => void;
  stopSound: (key: AudioKey) => void;
  toggleMute: () => boolean;
  setVolume: (volume: number) => void;
  setCategoryVolume: (category: AudioCategory, volume: number) => void;
  isMuted: boolean;
}

// Audio service interface
export interface AudioServiceInterface {
  play: (key: AudioKey) => void;
  stop: (key: AudioKey) => void;
  stopAll: () => void;
  stopCategory: (category: AudioCategory) => void;
  mute: () => void;
  unmute: () => void;
  toggleMute: () => boolean;
  setVolume: (key: AudioKey, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  setCategoryVolume: (category: AudioCategory, volume: number) => void;
  readonly isMuted: boolean;
}
