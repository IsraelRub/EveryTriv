import { useState } from 'react';
import { ChevronDown, Volume2, VolumeX } from 'lucide-react';

import { calculatePercentage } from '@shared/utils';

import { ButtonSize, VariantBase } from '@/constants';
import {
	Button,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
	Label,
	Slider,
} from '@/components';
import { useAudioSettings } from '@/hooks';
import type { AudioControlsProps } from '@/types';
import { cn } from '@/utils';

export function AudioControls({ className = '' }: AudioControlsProps) {
	const { state, handlers } = useAudioSettings();
	const [isOpen, setIsOpen] = useState(false);

	const MainVolumeIcon = state.isMuted ? VolumeX : Volume2;

	return (
		<div
			className={cn(
				'group inline-flex items-center rounded-full bg-background border border-border shadow-sm overflow-hidden',
				className
			)}
		>
			{/* Main button - mute/unmute toggle */}
			<Button
				variant={VariantBase.MINIMAL}
				onClick={handlers.handleMuteToggle}
				className={cn('h-9 rounded-none px-3 hover:bg-muted/50 transition-colors', state.isMuted && 'bg-muted/20')}
				title={state.isMuted ? 'Unmute audio' : 'Mute audio'}
			>
				<MainVolumeIcon className={cn('h-4 w-4', state.isMuted && 'text-muted-foreground')} />
			</Button>

			{/* Divider */}
			<div className='h-5 w-px bg-border' />

			{/* Dropdown trigger */}
			<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
				<DropdownMenuTrigger asChild>
					<Button
						variant={VariantBase.MINIMAL}
						size={ButtonSize.ICON_LG}
						className='h-9 w-8 rounded-none hover:bg-muted/50 shrink-0'
						title='Audio settings'
					>
						<ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')} />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className='w-64 p-4' align='end' sideOffset={8}>
					<div className='flex flex-col gap-4'>
						{/* Volume Slider Section */}
						<div className='space-y-3'>
							<div className='flex items-center justify-between'>
								<Label className='text-sm font-medium leading-none'>Master Volume</Label>
								<span className='text-xs text-muted-foreground font-mono w-9 text-right'>
									{calculatePercentage(state.volume, 1)}%
								</span>
							</div>
							<Slider
								value={[state.volume]}
								onValueChange={handlers.handleVolumeChange}
								min={0}
								max={1}
								step={0.01}
								className='w-full py-1'
							/>
						</div>

						<div className='flex flex-col gap-1'>
							{/* Sound Effects Toggle */}
							<DropdownMenuCheckboxItem
								checked={state.soundEnabled}
								onCheckedChange={handlers.handleSoundEnabledChange}
								onSelect={e => e.preventDefault()}
								className='cursor-pointer'
							>
								<div className='flex items-center justify-between w-full'>
									<span>Sound Effects</span>
								</div>
							</DropdownMenuCheckboxItem>

							{/* Music Toggle */}
							<DropdownMenuCheckboxItem
								checked={state.musicEnabled}
								onCheckedChange={handlers.handleMusicEnabledChange}
								onSelect={e => e.preventDefault()}
								className='cursor-pointer'
							>
								<div className='flex items-center justify-between w-full'>
									<span>Music</span>
								</div>
							</DropdownMenuCheckboxItem>
						</div>
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
