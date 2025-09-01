// Browser-specific audio interfaces
export interface WindowWithWebkitAudio extends Window {
	webkitAudioContext?: typeof AudioContext;
}

export interface PerformanceWithMemory extends Performance {
	memory?: {
		usedJSHeapSize: number;
		totalJSHeapSize: number;
		jsHeapSizeLimit: number;
	};
}

// Audio analytics types
export interface VolumeHistory {
	timestamp: Date;
	volume: number;
}

export interface AudioInteractionEvent {
	type: string;
	timestamp: Date;
	data?: Record<string, unknown>;
}

export interface AudioAnalytics {
	totalPlays: number;
	playTime: number;
	mostPlayed: string[];
	volumeHistory: VolumeHistory[];
	interactionEvents: AudioInteractionEvent[];
	averageVolume: number;
	muteTime: number;
	performanceScore: number;
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

// Audio performance metrics
export interface AudioPerformance {
	loadedSounds: number;
	memoryUsage: number;
	activeChannels: number;
}

// Audio State Types
export interface AudioState {
	isEnabled: boolean;
	isMuted: boolean;
	volume: number;
	masterVolume: number;
	currentTrack: string | null;
	audioContext: AudioContext | null;
	categoryVolumes: Record<string, number>;
	currentSounds: Set<string>;
	userInteracted: boolean;
	isAudioContextSupported: boolean;
	performance: AudioPerformance;
}

// Utility types using Pick and Omit
export type AudioStateReadonly = Readonly<AudioState>;
export type AudioStateWithoutContext = Omit<AudioState, 'audioContext'>;
export type AudioStatePerformance = Pick<AudioState, 'performance'>;

/**
 * עדכון ביצועי אודיו
 * @used_by client/src/hooks/contexts/AudioContext.tsx
 */
export interface AudioPerformanceUpdate {
	loadedSounds?: number;
	memoryUsage?: number;
	activeChannels?: number;
}
