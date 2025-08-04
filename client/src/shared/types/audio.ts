export type AudioKey = 'background' | 'correct' | 'wrong' | 'newUser' | 'click' | 'hover';

export interface AudioConfig {
  volume: number;
  loop?: boolean;
}

export interface AudioContextType {
  playSound: (key: AudioKey) => void;
  stopSound: (key: AudioKey) => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  isMuted: boolean;
}

export interface AudioControlsProps {
  className?: string;
}