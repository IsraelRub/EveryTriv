import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Volume2, VolumeX } from 'lucide-react';

import { calculatePercentage } from '@shared/utils';

import { ButtonSize, CommonKey, VariantBase } from '@/constants';
import { cn } from '@/utils';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, Label, Slider } from '@/components';
import { useAudioSettings } from '@/hooks';

export function AudioControls() {
	const { t } = useTranslation();
	const { state, handlers } = useAudioSettings();
	const [isOpen, setIsOpen] = useState(false);

	const MainVolumeIcon = state.isMuted ? VolumeX : Volume2;

	return (
		<div className='group inline-flex items-center rounded-full bg-background border border-border shadow-sm overflow-hidden'>
			{/* Main button - mute/unmute toggle */}
			<Button
				variant={VariantBase.MINIMAL}
				onClick={handlers.handleMuteToggle}
				className={cn('h-9 rounded-none px-3 hover:bg-muted/50 transition-colors', state.isMuted && 'bg-muted/20')}
				title={state.isMuted ? t(CommonKey.UNMUTE_AUDIO) : t(CommonKey.MUTE_AUDIO)}
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
						title={t(CommonKey.AUDIO_SETTINGS)}
					>
						<ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')} />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className='w-64 p-4' align='end' sideOffset={8}>
					<div className='flex flex-col gap-4'>
						{/* Main volume */}
						<div className='space-y-3'>
							<div className='flex items-center justify-between'>
								<Label className='text-sm font-medium leading-none'>{t(CommonKey.MASTER_VOLUME)}</Label>
								<span className='text-xs text-muted-foreground font-mono w-9 text-right'>
									{state.isMuted ? '0%' : `${calculatePercentage(state.volume, 1)}%`}
								</span>
							</div>
							<Slider
								value={[state.isMuted ? 0 : state.volume]}
								onValueChange={handlers.handleVolumeChange}
								min={0}
								max={1}
								step={0.01}
								className='w-full py-1'
							/>
						</div>

						{/* Category volumes – smaller, visually separate */}
						<div className='space-y-3 border-t border-border pt-3'>
							<div className='space-y-2'>
								<div className='flex items-center justify-between'>
									<Label className='text-xs font-medium leading-none text-muted-foreground'>
										{t(CommonKey.SOUND_EFFECTS_VOLUME)}
									</Label>
									<span className='text-xs text-muted-foreground font-mono w-9 text-right'>
										{calculatePercentage(state.soundEffectsVolume, 1)}%
									</span>
								</div>
								<Slider
									size='sm'
									value={[state.soundEffectsVolume]}
									onValueChange={handlers.handleSoundEffectsVolumeChange}
									min={0}
									max={1}
									step={0.01}
									className='w-full py-0.5'
								/>
							</div>
							<div className='space-y-2'>
								<div className='flex items-center justify-between'>
									<Label className='text-xs font-medium leading-none text-muted-foreground'>
										{t(CommonKey.MUSIC_VOLUME)}
									</Label>
									<span className='text-xs text-muted-foreground font-mono w-9 text-right'>
										{calculatePercentage(state.musicVolume, 1)}%
									</span>
								</div>
								<Slider
									size='sm'
									value={[state.musicVolume]}
									onValueChange={handlers.handleMusicVolumeChange}
									min={0}
									max={1}
									step={0.01}
									className='w-full py-0.5'
								/>
							</div>
						</div>
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
