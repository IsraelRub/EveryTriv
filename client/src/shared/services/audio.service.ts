type AudioKey = 'background' | 'correct' | 'wrong' | 'newUser' | 'click' | 'hover';

interface AudioConfig {
  volume: number;
  loop?: boolean;
}

class AudioService {
  private audioElements: Map<AudioKey, HTMLAudioElement> = new Map();
  private isMuted = false;
  private volumes: Map<AudioKey, number> = new Map([
    ['background', 0.3],    // רקע בווליום נמוך יותר
    ['correct', 0.7],       // תשובה נכונה
    ['wrong', 0.7],         // תשובה שגויה
    ['newUser', 0.7],       // משתמש חדש
    ['click', 0.5],         // לחיצה על כפתור
    ['hover', 0.3],         // hover על אלמנטים
  ]);

  constructor() {
    // טעינת הצלילים מראש
    this.preloadAudio('background', '/assets/audio/background-music.mp3', { volume: 0.3, loop: true });
    this.preloadAudio('correct', '/assets/audio/correct-answer.mp3', { volume: 0.7 });
    this.preloadAudio('wrong', '/assets/audio/wrong-answer.mp3', { volume: 0.7 });
    this.preloadAudio('newUser', '/assets/audio/new-user.mp3', { volume: 0.7 });
    this.preloadAudio('click', '/assets/audio/click.mp3', { volume: 0.5 });
    this.preloadAudio('hover', '/assets/audio/hover.mp3', { volume: 0.3 });
  }

  private preloadAudio(key: AudioKey, src: string, config: AudioConfig): void {
    const audio = new Audio(src);
    audio.volume = this.isMuted ? 0 : config.volume;
    if (config.loop) {
      audio.loop = true;
    }
    this.audioElements.set(key, audio);
  }

  public play(key: AudioKey): void {
    const audio = this.audioElements.get(key);
    if (!audio) return;

    // אם זה צליל רקע, נעצור את הקודם אם מתנגן
    if (key === 'background') {
      audio.currentTime = 0;
    } else {
      // עבור אפקטים, ניצור עותק חדש כדי לאפשר הפעלה מקבילה
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = this.isMuted ? 0 : (this.volumes.get(key) || 0.7);
      clone.play().catch(console.error);
      return;
    }

    audio.play().catch(console.error);
  }

  public stop(key: AudioKey): void {
    const audio = this.audioElements.get(key);
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
  }

  public stopAll(): void {
    this.audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  public mute(): void {
    this.isMuted = true;
    this.audioElements.forEach(audio => {
      audio.volume = 0;
    });
  }

  public unmute(): void {
    this.isMuted = false;
    this.audioElements.forEach((audio, key) => {
      audio.volume = this.volumes.get(key) || 0.7;
    });
  }

  public toggleMute(): void {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  public setVolume(key: AudioKey, volume: number): void {
    const audio = this.audioElements.get(key);
    if (!audio || this.isMuted) return;

    this.volumes.set(key, volume);
    audio.volume = volume;
  }

  public setMasterVolume(volume: number): void {
    this.audioElements.forEach((audio, key) => {
      const relativeVolume = volume * (this.volumes.get(key) || 0.7);
      audio.volume = this.isMuted ? 0 : relativeVolume;
    });
  }
}