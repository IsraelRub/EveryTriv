import { createContext, useContext, useMemo } from 'react';

import { audioService } from '@/services';
import type { AudioProviderProps, AudioServiceInterface } from '@/types';

const AudioContext = createContext<AudioServiceInterface | null>(null);

export function AudioProvider({ children, service = audioService }: AudioProviderProps): JSX.Element {
	const contextValue = useMemo(() => service, [service]);

	return <AudioContext.Provider value={contextValue}>{children}</AudioContext.Provider>;
}

export function useAudio(): AudioServiceInterface {
	const context = useContext(AudioContext);
	return context ?? audioService;
}
