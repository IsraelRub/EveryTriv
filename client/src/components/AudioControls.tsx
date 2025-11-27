import { ChangeEvent, memo, useCallback, useEffect, useState } from 'react';

import { ButtonVariant, CLIENT_STORAGE_KEYS, ComponentSize } from '../constants';
import { useAudio } from '../hooks/useAudio';
import { storageService } from '../services';
import { AudioControlsProps } from '../types';
import { combineClassNames } from '../utils';
import { Button } from './ui';
import { Icon } from './ui/IconLibrary';

/**
 * Main audio controls component
 * Provides volume slider and mute toggle
 */
const AudioControls = memo(function AudioControls({ className }: AudioControlsProps) {
	const audioService = useAudio();
	const [isMuted, setIsMuted] = useState(false);
	const [volume, setVolume] = useState(0.7);

	// Load initial state from service and storage
	useEffect(() => {
		const loadAudioSettings = async () => {
			// Sync mute state from service (already initialized in App.tsx)
			setIsMuted(!audioService.isEnabled);

			// Load volume from storage
			const storedVolume = await storageService.getNumber(CLIENT_STORAGE_KEYS.AUDIO_VOLUME);
			if (storedVolume.success && storedVolume.data) {
				setVolume(storedVolume.data);
				audioService.setMasterVolume(storedVolume.data);
			} else {
				setVolume(audioService.volume);
			}
		};

		loadAudioSettings();
	}, [audioService]);

	const handleVolumeChange = useCallback(
		async (e: ChangeEvent<HTMLInputElement>) => {
			const newVolume = parseFloat(e.target.value);
			setVolume(newVolume);
			audioService.setMasterVolume(newVolume);

			// Save volume to storage
			await storageService.set(CLIENT_STORAGE_KEYS.AUDIO_VOLUME, newVolume);
		},
		[audioService]
	);

	const handleMuteToggle = useCallback(async () => {
		const newMutedState = audioService.toggleMute();
		setIsMuted(newMutedState);

		// Save mute state to storage
		await storageService.set(CLIENT_STORAGE_KEYS.AUDIO_MUTED, newMutedState);
	}, [audioService]);

	return (
		<div className={combineClassNames('flex items-center gap-2', className)}>
			<Button
				variant={ButtonVariant.GHOST}
				size={ComponentSize.SM}
				onClick={handleMuteToggle}
				className='p-2'
				title={isMuted ? 'Unmute' : 'Mute'}
			>
				{isMuted ? <Icon name='volumex' size={ComponentSize.MD} /> : <Icon name='volume' size={ComponentSize.MD} />}
			</Button>

			<input
				type='range'
				min='0'
				max='1'
				step='0.1'
				value={volume}
				onChange={handleVolumeChange}
				className='w-24 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer'
				title='Master Volume'
			/>
		</div>
	);
});

export default AudioControls;
