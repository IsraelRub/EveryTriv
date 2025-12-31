import { memo, useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ChevronDown, HeadphoneOff, Headphones, Volume2, VolumeX } from 'lucide-react';

import { mergeUserPreferences } from '@shared/utils';
import { AudioKey, ButtonSize, ButtonVariant, CLIENT_STORAGE_KEYS } from '@/constants';
import {
	Button,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Slider,
} from '@/components';
import { useUpdateUserPreferences, useUserProfile } from '@/hooks';
import { audioService, clientLogger as logger, storageService } from '@/services';
import type { AudioControlsProps, RootState } from '@/types';
import { cn } from '@/utils';

/**
 * Audio Controls Component
 * Provides volume slider and mute toggle for game audio
 */
export const AudioControls = memo(function AudioControls({ className = '', showSlider = true }: AudioControlsProps) {
	const [isMuted, setIsMuted] = useState(false);
	const [volume, setVolume] = useState(0.7);
	const [isOpen, setIsOpen] = useState(false);

	// Check if user is authenticated
	const { isAuthenticated } = useSelector((state: RootState) => state.user);

	const { data: userProfile } = useUserProfile();
	const updatePreferences = useUpdateUserPreferences();

	// Get preferences from profile
	const preferences = userProfile?.profile?.preferences;

	// Local state for immediate UI updates
	const [soundEnabled, setLocalSoundEnabled] = useState(preferences?.soundEnabled ?? true);
	const [musicEnabled, setLocalMusicEnabled] = useState(preferences?.musicEnabled ?? true);

	// Load local preferences from storage for unauthenticated users
	useEffect(() => {
		const loadLocalPreferences = async () => {
			if (!isAuthenticated) {
				const storedSoundEnabled = await storageService.getBoolean(CLIENT_STORAGE_KEYS.AUDIO_SOUND_ENABLED);
				const storedMusicEnabled = await storageService.getBoolean(CLIENT_STORAGE_KEYS.AUDIO_MUSIC_ENABLED);

				if (storedSoundEnabled.success && storedSoundEnabled.data !== undefined) {
					setLocalSoundEnabled(storedSoundEnabled.data);
				}
				if (storedMusicEnabled.success && storedMusicEnabled.data !== undefined) {
					setLocalMusicEnabled(storedMusicEnabled.data);
				}
			}
		};
		loadLocalPreferences();
	}, [isAuthenticated]);

	// Sync local state with profile preferences for authenticated users
	useEffect(() => {
		if (preferences && isAuthenticated) {
			setLocalSoundEnabled(preferences.soundEnabled ?? true);
			setLocalMusicEnabled(preferences.musicEnabled ?? true);
		}
	}, [preferences, isAuthenticated]);

	// Load initial state from storage
	// This is the single source of truth for loading audio settings from storage
	// AudioControls component is responsible for initializing audio state
	useEffect(() => {
		const loadAudioSettings = async () => {
			// Load muted state from storage first (storage is source of truth)
			const storedMuted = await storageService.getBoolean(CLIENT_STORAGE_KEYS.AUDIO_MUTED);
			if (storedMuted.success && storedMuted.data !== undefined) {
				// Storage has a value - use it as source of truth
				setIsMuted(storedMuted.data);
				// Sync audio service with storage value
				if (storedMuted.data && audioService.isEnabled) {
					audioService.mute();
				} else if (!storedMuted.data && !audioService.isEnabled) {
					audioService.unmute();
				}
			} else {
				// No storage value - use default (isMuted = false) and save to storage
				const defaultMuted = false;
				setIsMuted(defaultMuted);
				// Ensure audio service matches default
				if (!audioService.isEnabled) {
					audioService.unmute();
				}
				// Save default to storage for consistency
				await storageService.set(CLIENT_STORAGE_KEYS.AUDIO_MUTED, defaultMuted);
			}

			// Load volume from storage
			const storedVolume = await storageService.getNumber(CLIENT_STORAGE_KEYS.AUDIO_VOLUME);
			if (storedVolume.success && storedVolume.data !== undefined) {
				setVolume(storedVolume.data);
				audioService.setMasterVolume(storedVolume.data);
			} else {
				// Use default volume and save to storage
				const defaultVolume = 0.7;
				setVolume(defaultVolume);
				audioService.setMasterVolume(defaultVolume);
				await storageService.set(CLIENT_STORAGE_KEYS.AUDIO_VOLUME, defaultVolume);
			}
		};

		loadAudioSettings();
	}, []);

	// Sync audio service with user preferences (authenticated) or local preferences (unauthenticated)
	useEffect(() => {
		// Get preferences based on authentication status
		const currentPreferences = isAuthenticated && preferences ? preferences : { soundEnabled, musicEnabled };
		const mergedPreferences = mergeUserPreferences(null, currentPreferences);
		audioService.setUserPreferences(mergedPreferences);

		// Start background music if user already interacted, music is enabled, and not muted
		if (!isMuted && mergedPreferences.musicEnabled) {
			audioService.markUserInteracted();
			// Use requestAnimationFrame to ensure preferences are updated first
			requestAnimationFrame(() => {
				audioService.play(AudioKey.BACKGROUND_MUSIC);
			});
		}
	}, [preferences, isAuthenticated, soundEnabled, musicEnabled, isMuted]);

	const handleVolumeChange = useCallback(
		async (values: number[]) => {
		const newVolume = values[0];
		if (newVolume == null) {
			logger.mediaWarn('Volume change received undefined value');
			return;
		}
			setVolume(newVolume);
			audioService.setMasterVolume(newVolume);

			// If volume is set and was muted, unmute
			if (newVolume > 0 && isMuted) {
				setIsMuted(false);
				audioService.unmute();
				await storageService.set(CLIENT_STORAGE_KEYS.AUDIO_MUTED, false);
			}

			// Save volume to storage
			await storageService.set(CLIENT_STORAGE_KEYS.AUDIO_VOLUME, newVolume);
		},
		[isMuted]
	);

	const handleMuteToggle = useCallback(async () => {
		const newMutedState = audioService.toggleMute();
		setIsMuted(newMutedState);

		// Save mute state to storage
		await storageService.set(CLIENT_STORAGE_KEYS.AUDIO_MUTED, newMutedState);
	}, []);

	const handleToggleAll = useCallback(async () => {
		const allEnabled = soundEnabled && musicEnabled;
		const newSoundEnabled = !allEnabled;
		const newMusicEnabled = !allEnabled;

		// Optimistic UI update
		setLocalSoundEnabled(newSoundEnabled);
		setLocalMusicEnabled(newMusicEnabled);

		// Optimistic update - update audio service immediately
		const newPreferences = {
			...preferences,
			soundEnabled: newSoundEnabled,
			musicEnabled: newMusicEnabled,
		};
		const mergedPreferences = mergeUserPreferences(null, newPreferences);
		audioService.setUserPreferences(mergedPreferences);

		// Handle music playback
		if (!newMusicEnabled) {
			// Stop music if disabled
			audioService.stop(AudioKey.BACKGROUND_MUSIC);
			audioService.stop(AudioKey.GAME_MUSIC);
		} else {
			// Start background music if enabled and not muted
			// Mark user interaction since clicking the button counts as interaction
			if (!isMuted) {
				audioService.markUserInteracted();
				// Use requestAnimationFrame to ensure preferences are updated first
				requestAnimationFrame(() => {
					audioService.play(AudioKey.BACKGROUND_MUSIC);
				});
			}
		}

		// Only update server preferences if user is authenticated
		if (isAuthenticated) {
			try {
				await updatePreferences.mutateAsync({
					soundEnabled: newSoundEnabled,
					musicEnabled: newMusicEnabled,
				});
			} catch {
				// Revert on error
				setLocalSoundEnabled(preferences?.soundEnabled ?? true);
				setLocalMusicEnabled(preferences?.musicEnabled ?? true);
				if (preferences) {
					const revertedPreferences = mergeUserPreferences(null, preferences);
					audioService.setUserPreferences(revertedPreferences);
				}
			}
		} else {
			// Save to local storage for unauthenticated users
			await storageService.set(CLIENT_STORAGE_KEYS.AUDIO_SOUND_ENABLED, newSoundEnabled);
			await storageService.set(CLIENT_STORAGE_KEYS.AUDIO_MUSIC_ENABLED, newMusicEnabled);
		}
	}, [soundEnabled, musicEnabled, preferences, updatePreferences, isMuted, isAuthenticated]);

	const handleSoundEnabledChange = useCallback(
		async (checked: boolean) => {
			// Optimistic UI update
			setLocalSoundEnabled(checked);

			// Optimistic update - update audio service immediately
			const newPreferences = {
				...preferences,
				soundEnabled: checked,
			};
			const mergedPreferences = mergeUserPreferences(null, newPreferences);
			audioService.setUserPreferences(mergedPreferences);

			// Only update server preferences if user is authenticated
			if (isAuthenticated) {
				try {
					await updatePreferences.mutateAsync({ soundEnabled: checked });
				} catch {
					// Revert on error
					setLocalSoundEnabled(preferences?.soundEnabled ?? true);
					if (preferences) {
						const revertedPreferences = mergeUserPreferences(null, preferences);
						audioService.setUserPreferences(revertedPreferences);
					}
				}
			} else {
				// Save to local storage for unauthenticated users
				await storageService.set(CLIENT_STORAGE_KEYS.AUDIO_SOUND_ENABLED, checked);
			}
		},
		[preferences, updatePreferences, isAuthenticated]
	);

	const handleMusicEnabledChange = useCallback(
		async (checked: boolean) => {
			// Optimistic UI update
			setLocalMusicEnabled(checked);

			// Optimistic update - update audio service immediately
			const newPreferences = {
				...preferences,
				musicEnabled: checked,
			};
			const mergedPreferences = mergeUserPreferences(null, newPreferences);
			audioService.setUserPreferences(mergedPreferences);

			// Stop music if disabled
			if (!checked) {
				audioService.stop(AudioKey.BACKGROUND_MUSIC);
				audioService.stop(AudioKey.GAME_MUSIC);
			} else {
				// Start background music if enabled and not muted
				// Mark user interaction since clicking the button counts as interaction
				if (!isMuted) {
					audioService.markUserInteracted();
					// Use requestAnimationFrame to ensure preferences are updated first
					requestAnimationFrame(() => {
						audioService.play(AudioKey.BACKGROUND_MUSIC);
					});
				}
			}

			// Only update server preferences if user is authenticated
			if (isAuthenticated) {
				try {
					await updatePreferences.mutateAsync({ musicEnabled: checked });
				} catch {
					// Revert on error
					setLocalMusicEnabled(preferences?.musicEnabled ?? true);
					if (preferences) {
						const revertedPreferences = mergeUserPreferences(null, preferences);
						audioService.setUserPreferences(revertedPreferences);
					}
				}
			} else {
				// Save to local storage for unauthenticated users
				await storageService.set(CLIENT_STORAGE_KEYS.AUDIO_MUSIC_ENABLED, checked);
			}
		},
		[preferences, updatePreferences, isMuted, isAuthenticated]
	);

	// Determine main icon based on mute state
	const MainVolumeIcon = isMuted ? VolumeX : Volume2;

	// Simple button without slider
	if (!showSlider) {
		return (
			<Button
				variant={ButtonVariant.GHOST}
				size={ButtonSize.ICON}
				onClick={handleMuteToggle}
				className={className}
				title={isMuted ? 'Unmute' : 'Mute'}
			>
				{isMuted ? <VolumeX className='h-5 w-5 text-muted-foreground' /> : <Volume2 className='h-5 w-5' />}
			</Button>
		);
	}

	// Full controls with split button and dropdown
	return (
		<div className={cn('inline-flex items-center rounded-full bg-primary/10 overflow-hidden', className)}>
			{/* Main button - mute/unmute toggle */}
			<Button
				variant={ButtonVariant.GHOST}
				onClick={handleMuteToggle}
				className={cn('h-8 rounded-none px-3 hover:bg-primary/20 relative', isMuted && 'opacity-60')}
				title={isMuted ? 'Unmute audio' : 'Mute audio'}
			>
				<div className='flex items-center gap-1.5'>
					<MainVolumeIcon className={cn('h-4 w-4', isMuted && 'text-muted-foreground')} />
					{isMuted && (
						<span className='absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive border border-background' />
					)}
				</div>
			</Button>

			{/* Divider */}
			<div className='h-6 w-px bg-border/50' />

			{/* Dropdown trigger - narrower part */}
			<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
				<DropdownMenuTrigger asChild>
					<Button
						variant={ButtonVariant.GHOST}
						size={ButtonSize.ICON}
						className='h-8 w-8 rounded-none hover:bg-primary/20 shrink-0'
						title='Audio settings'
					>
						<ChevronDown className='h-4 w-4' />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className='w-56 p-3' align='end'>
					<div className='space-y-3'>
						{/* Volume Slider */}
						<div className='space-y-2'>
							<div className='flex items-center justify-between'>
								<span className='text-sm font-medium'>Volume</span>
								<span className='text-sm text-muted-foreground'>{Math.round(volume * 100)}%</span>
							</div>
							<Slider
								value={[volume]}
								onValueChange={handleVolumeChange}
								min={0}
								max={1}
								step={0.01}
								className='w-full'
							/>
						</div>

						<DropdownMenuSeparator />

						{/* Toggle All Button */}
						<DropdownMenuItem
							onClick={() => {
								handleToggleAll();
								setIsOpen(false);
							}}
							className='cursor-pointer'
						>
							<div className='flex items-center justify-between w-full'>
								<span className='text-sm font-medium'>
									{soundEnabled && musicEnabled ? 'Disable All Audio' : 'Enable All Audio'}
								</span>
								<div className='flex items-center gap-1.5'>
									{soundEnabled && musicEnabled ? (
										<>
											<Headphones className='h-3.5 w-3.5 text-muted-foreground' />
											<Volume2 className='h-3.5 w-3.5 text-muted-foreground' />
										</>
									) : (
										<>
											<HeadphoneOff className='h-3.5 w-3.5 text-muted-foreground' />
											<VolumeX className='h-3.5 w-3.5 text-muted-foreground' />
										</>
									)}
								</div>
							</div>
						</DropdownMenuItem>

						<DropdownMenuSeparator />

						{/* Sound Effects Toggle */}
						<DropdownMenuCheckboxItem checked={soundEnabled} onCheckedChange={handleSoundEnabledChange}>
							<div className='flex items-center justify-between w-full'>
								<span>Sound Effects</span>
								{soundEnabled ? (
									<Volume2 className='h-3.5 w-3.5 text-muted-foreground ml-2' />
								) : (
									<VolumeX className='h-3.5 w-3.5 text-muted-foreground ml-2' />
								)}
							</div>
						</DropdownMenuCheckboxItem>

						{/* Music Toggle */}
						<DropdownMenuCheckboxItem checked={musicEnabled} onCheckedChange={handleMusicEnabledChange}>
							<div className='flex items-center justify-between w-full'>
								<span>Music</span>
								{musicEnabled ? (
									<Headphones className='h-3.5 w-3.5 text-muted-foreground ml-2' />
								) : (
									<HeadphoneOff className='h-3.5 w-3.5 text-muted-foreground ml-2' />
								)}
							</div>
						</DropdownMenuCheckboxItem>
					</div>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
});
