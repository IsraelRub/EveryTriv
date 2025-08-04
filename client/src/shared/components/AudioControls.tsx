import { useState } from 'react';
import { useAudio } from '../hooks/useAudio';
import { Button } from './ui/Button';

export const AudioControls = () => {
  const { toggleMute, setVolume } = useAudio();
  const [isMuted, setIsMuted] = useState(() => 
    localStorage.getItem('audioMuted') === 'true'
  );
  const [volume, setVolumeState] = useState(() => 
    parseFloat(localStorage.getItem('audioVolume') || '0.7')
  );

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolumeState(newVolume);
    setVolume(newVolume);
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    toggleMute();
  };

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleMuteToggle}
        className="p-2"
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? '🔇' : '🔊'}
      </Button>
      
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={volume}
        onChange={handleVolumeChange}
        className="w-24 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
        title="Volume Control"
      />
    </div>
  );
};