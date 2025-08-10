import { useState } from 'react';
import { AudioControlsProps, CategoryVolumeControlProps } from '../../types';
import { Volume2, VolumeX, Music, Gamepad2 } from 'lucide-react';
import { AudioCategory } from '@/shared/constants';
import { Button } from '../ui';
import { cn } from '@/shared/utils/cn';
import { useAudioContext } from '@/shared/hooks';

/**
 * Main audio controls component
 * Provides volume slider and mute toggle
 */
const AudioControls = ({ className }: AudioControlsProps) => {
	const { toggleMute, setVolume, isMuted } = useAudioContext();
	const [volume, setVolumeState] = useState(() => parseFloat(localStorage.getItem('audioVolume') || '0.7'));

	const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newVolume = parseFloat(e.target.value);
		setVolumeState(newVolume);
		setVolume(newVolume);
	};

	const handleMuteToggle = () => {
		toggleMute();
	};

	return (
		<div className={cn('flex items-center gap-2', className)}>
			<Button variant='ghost' size='sm' onClick={handleMuteToggle} className='p-2' title={isMuted ? 'Unmute' : 'Mute'}>
				{isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
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

/**
 * Advanced audio controls with category volume sliders
 * Provides separate controls for music, UI, and gameplay sounds
 */
export const AdvancedAudioControls = ({ className }: AudioControlsProps) => {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div className={cn('flex flex-col', className)}>
			<div className='flex items-center gap-2'>
				<AudioControls />
				<Button variant='ghost' size='sm' onClick={() => setIsExpanded(!isExpanded)} className='p-2'>
					{isExpanded ? '▼' : '▶'}
				</Button>
			</div>

			{isExpanded && (
				<div className='flex flex-col gap-2 mt-2 p-3 bg-black/20 rounded-md'>
					<CategoryVolumeControl category={AudioCategory.MUSIC} label='Music' className='mb-1' />
					<CategoryVolumeControl category={AudioCategory.GAMEPLAY} label='Game Effects' />
					<CategoryVolumeControl category={AudioCategory.UI} label='UI Sounds' />
				</div>
			)}
		</div>
	);
};

/**
 * Category volume control component
 * Controls volume for a specific category of sounds
 */
const CategoryVolumeControl = ({ category, label, className }: CategoryVolumeControlProps) => {
	const { setCategoryVolume } = useAudioContext();
	const [volume, setVolumeState] = useState(() => parseFloat(localStorage.getItem(`audio_${category}Volume`) || '1'));

	const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newVolume = parseFloat(e.target.value);
		setVolumeState(newVolume);
		setCategoryVolume(category, newVolume);
	};

	const getCategoryIcon = () => {
		switch (category) {
			case AudioCategory.MUSIC:
				return <Music size={16} />;
			case AudioCategory.GAMEPLAY:
				return <Gamepad2 size={16} />;
			default:
				return <Volume2 size={16} />;
		}
	};

	return (
		<div className={cn('flex items-center gap-2', className)}>
			<div className='flex items-center gap-1 w-24'>
				{getCategoryIcon()}
				<span className='text-xs'>{label}</span>
			</div>
			<input
				type='range'
				min='0'
				max='1'
				step='0.1'
				value={volume}
				onChange={handleVolumeChange}
				className='w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer'
			/>
		</div>
	);
};
