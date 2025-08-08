# Audio Documentation for EveryTriv

This document provides an overview of the audio system in EveryTriv, including how to use audio effects in your components and how to extend the system with new sounds.

## Table of Contents

1. [Audio System Overview](#audio-system-overview)
2. [Directory Structure](#directory-structure)
3. [Using Audio in Components](#using-audio-in-components)
4. [Available Sound Effects](#available-sound-effects)
5. [Adding New Sounds](#adding-new-sounds)
6. [Audio Controls](#audio-controls)
7. [Volume Management](#volume-management)

## Audio System Overview

EveryTriv features a comprehensive audio system with:

- Background music
- Trivia game sound effects
- UI interaction sounds
- Achievement and milestone sounds
- Volume controls by category
- Mute functionality

The audio system is built on top of the Web Audio API with a React-friendly wrapper.

## Directory Structure

```
client/
├── public/assets/audio/       # Audio files
│   ├── music/                 # Background and game music
│   ├── ui/                    # UI sound effects
│   ├── gameplay/              # Trivia gameplay sounds
│   └── achievements/          # Achievement sounds
└── src/shared/audio/          # Audio system code
    ├── constants.ts           # Audio keys and paths
    ├── service.ts             # Core audio service
    ├── hooks.ts               # React hooks for audio
    ├── context.tsx            # React context for audio
    ├── components.tsx         # Audio UI components
    └── types.ts               # TypeScript types
```

## Using Audio in Components

### Basic Usage

```tsx
import { useAudioContext } from '../shared/audio';
import { AudioKey } from '../shared/audio/constants';

function MyComponent() {
  const { playSound } = useAudioContext();
  
  const handleClick = () => {
    playSound(AudioKey.CLICK);
    // Do something
  };
  
  return (
    <button onClick={handleClick}>Click Me</button>
  );
}
```

### Using Background Music

```tsx
import { useBackgroundMusic } from '../shared/audio';

function MyComponent() {
  // This will automatically play background music
  // and clean it up when the component unmounts
  useBackgroundMusic();
  
  return <div>My Component</div>;
}
```

### Using Game Music

```tsx
import { useGameMusic } from '../shared/audio';

function GameComponent() {
  const [isGameActive, setIsGameActive] = useState(false);
  
  // This will switch from background to game music
  // when the game is active
  useGameMusic(isGameActive);
  
  return <div>Game Component</div>;
}
```

## Available Sound Effects

### Music
- `AudioKey.BACKGROUND_MUSIC`: Main background music
- `AudioKey.GAME_MUSIC`: Music during active gameplay

### UI Sounds
- `AudioKey.CLICK`: Button click sound
- `AudioKey.HOVER`: Hover sound for interactive elements

### Gameplay Sounds
- `AudioKey.CORRECT_ANSWER`: Correct answer sound
- `AudioKey.WRONG_ANSWER`: Wrong answer sound
- `AudioKey.GAME_START`: Game start sound
- `AudioKey.GAME_END`: Game end sound
- `AudioKey.COUNTDOWN`: Timer countdown sound
- `AudioKey.POINT_EARNED`: Points earned sound
- `AudioKey.POINT_STREAK`: Point streak sound

### Achievement Sounds
- `AudioKey.NEW_ACHIEVEMENT`: New achievement unlocked
- `AudioKey.NEW_USER`: Welcome sound for new users
- `AudioKey.LEVEL_UP`: Level up or milestone reached

## Adding New Sounds

1. **Add the audio file**: Place the MP3 file in the appropriate directory under `public/assets/audio/`

2. **Update constants.ts**:
   ```typescript
   // Add to AudioKey enum
   export enum AudioKey {
     // ... existing keys
     MY_NEW_SOUND = 'myNewSound',
   }
   
   // Add to AUDIO_PATHS
   export const AUDIO_PATHS: Record<AudioKey, string> = {
     // ... existing paths
     [AudioKey.MY_NEW_SOUND]: '/assets/audio/category/my-new-sound.mp3',
   }
   
   // Add to AUDIO_CATEGORIES
   export const AUDIO_CATEGORIES: Record<AudioKey, AudioCategory> = {
     // ... existing categories
     [AudioKey.MY_NEW_SOUND]: AudioCategory.MY_CATEGORY,
   }
   ```

3. **Use in components**:
   ```typescript
   playSound(AudioKey.MY_NEW_SOUND);
   ```

## Audio Controls

EveryTriv provides two audio control components:

### Basic Audio Controls
```tsx
import { AudioControls } from '../shared/audio';

function MyComponent() {
  return <AudioControls />;
}
```

### Advanced Audio Controls
```tsx
import { AdvancedAudioControls } from '../shared/audio';

function MyComponent() {
  return <AdvancedAudioControls />;
}
```

## Volume Management

### Category Volumes

The audio system allows controlling volume by category:

```tsx
import { useAudioContext } from '../shared/audio';
import { AudioCategory } from '../shared/audio/constants';

function VolumeControls() {
  const { setCategoryVolume } = useAudioContext();
  
  return (
    <div>
      <button onClick={() => setCategoryVolume(AudioCategory.MUSIC, 0.5)}>
        Set Music Volume to 50%
      </button>
    </div>
  );
}
```

### Master Volume

```tsx
const { setVolume } = useAudioContext();

// Set master volume to 70%
setVolume(0.7);
```

### Mute/Unmute

```tsx
const { toggleMute, isMuted } = useAudioContext();

return (
  <button onClick={toggleMute}>
    {isMuted ? 'Unmute' : 'Mute'}
  </button>
);
```
