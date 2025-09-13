import { ChangeEvent, memo, useCallback,useEffect, useState } from 'react';

import { useAudio } from '../../App';
import { CLIENT_STORAGE_KEYS } from '../../constants';
import { storageService } from '../../services';
import { AudioControlsProps } from '../../types';
import { combineClassNames } from '../../utils/combineClassNames';
import { Icon } from '../icons';
import { Button } from '../ui';

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
      setIsMuted(!audioService.isEnabled);
      setVolume(audioService.volume);

      // Load volume from storage
      const storedVolume = await storageService.get<number>(CLIENT_STORAGE_KEYS.AUDIO_VOLUME);
      if (
        storedVolume.success &&
        storedVolume.data !== null &&
        typeof storedVolume.data === 'number'
      ) {
        setVolume(storedVolume.data);
        audioService.setVolume(storedVolume.data);
      }
    };

    loadAudioSettings();
  }, []);

  const handleVolumeChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioService.setMasterVolume(newVolume);

    // Save volume to storage
    await storageService.set(CLIENT_STORAGE_KEYS.AUDIO_VOLUME, newVolume);
  }, []);

  const handleMuteToggle = useCallback(() => {
    const newMutedState = audioService.toggleMute();
    setIsMuted(newMutedState);
  }, []);

  return (
    <div className={combineClassNames('flex items-center gap-2', className)}>
      <Button
        variant='ghost'
        size='sm'
        onClick={handleMuteToggle}
        className='p-2'
        title={isMuted ? 'Unmute' : 'Mute'}
      >
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
});

export default AudioControls;
