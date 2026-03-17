import type { MutableRefObject } from 'react';

import type { AudioCategory } from '@/constants';

export interface AudioPreloadConfig {
	loop: boolean;
}

export interface AudioData {
	category: AudioCategory;
	path: string;
	loop: boolean;
	volume: number;
}

export interface AudioControlsProps {
	className?: string;
}

export interface UseAudioPreferencesProps {
	soundEnabled: boolean;
	musicEnabled: boolean;
	isMuted: boolean;
}

export interface UseAudioSyncProps {
	volume: number;
	soundEffectsVolume: number;
	musicVolume: number;
	isMuted: boolean;
	soundEnabled: boolean;
	musicEnabled: boolean;
	isInitialized: boolean;
	isInitializedRef: MutableRefObject<boolean>;
	preferences?: { soundEnabled?: boolean; musicEnabled?: boolean } | null;
	isAuthenticated: boolean;
}
