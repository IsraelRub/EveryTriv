import { ChangeEvent, useState } from 'react';

import { useAudio } from '../../hooks/contexts/AudioContext';
import { useThrottle } from '../../hooks/layers/utils/useThrottle';
import { AudioControlsProps } from '../../types';
import { combineClassNames } from '../../utils/combineClassNames';
import { Icon } from '../icons';
import { Button } from '../ui';

/**
 * Main audio controls component
 * Provides volume slider and mute toggle
 */
const AudioControls = ({ className }: AudioControlsProps) => {
	const { toggleMute, setMasterVolume, isMuted } = useAudio();
	const [volume, setVolumeState] = useState(() => parseFloat(localStorage.getItem('audioVolume') || '0.7'));

	// Throttle volume changes to avoid excessive audio updates
	const throttledSetVolume = useThrottle(setMasterVolume, 100);

	const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
		const newVolume = parseFloat(e.target.value);
		setVolumeState(newVolume);
		throttledSetVolume(newVolume);
	};

	const handleMuteToggle = () => {
		toggleMute();
	};

	return (
		<div className={combineClassNames('flex items-center gap-2', className)}>
			<Button variant='ghost' size='sm' onClick={handleMuteToggle} className='p-2' title={isMuted ? 'Unmute' : 'Mute'}>
				{isMuted ? <Icon name='volumex' size='md' /> : <Icon name='volume' size='md' />}
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
};



export default AudioControls;
