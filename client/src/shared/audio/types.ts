import { AudioKey, AudioCategory } from './constants';

export interface AudioConfig {
  volume?: number;
  loop?: boolean;
}

export interface AudioContextType {
  playSound: (key: AudioKey) => void;
  stopSound: (key: AudioKey) => void;
  toggleMute: () => boolean;
  setVolume: (volume: number) => void;
  setCategoryVolume: (category: AudioCategory, volume: number) => void;
  isMuted: boolean;
}

export interface AudioControlsProps {
  className?: string;
}

export interface CategoryVolumeControlProps {
  category: AudioCategory;
  label: string;
  className?: string;
}

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
