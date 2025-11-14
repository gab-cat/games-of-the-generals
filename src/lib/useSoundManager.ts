import { useState, useEffect, useCallback, useRef } from 'react';
import { Howl } from 'howler';

export type BGMType = 'main' | 'setup' | 'battle' | null;
export type SFXType = 'intro' | 'kill' | 'leaderboard' | 'match-found' | 'piece-move' | 'player-victory' | 'player-lose';

interface SoundSettings {
  bgmVolume: number;
  sfxVolume: number;
}

const DEFAULT_SETTINGS: SoundSettings = {
  bgmVolume: 0.3,
  sfxVolume: 0.7,
};

const SETTINGS_KEY = 'sound-settings';

export function useSoundManager() {
  const [settings, setSettings] = useState<SoundSettings>(DEFAULT_SETTINGS);
  const [currentBGM, setCurrentBGM] = useState<BGMType>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Refs for Howl instances
  const bgmInstancesRef = useRef<Map<BGMType, Howl>>(new Map());
  const sfxInstancesRef = useRef<Map<SFXType, Howl>>(new Map());
  const currentBGMInstanceRef = useRef<Howl | null>(null);
  const crossfadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
    } catch (error) {
      console.warn('Failed to load sound settings:', error);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings: SoundSettings) => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.warn('Failed to save sound settings:', error);
    }
  }, []);

  // Initialize audio instances
  useEffect(() => {
    const initializeAudio = () => {
      // Initialize BGM instances
      const bgmTracks: Record<NonNullable<BGMType>, string> = {
        main: '/bgm/main.opus',
        setup: '/bgm/setup.opus',
        battle: '/bgm/battle.opus',
      };

      Object.entries(bgmTracks).forEach(([type, path]) => {
        const bgmType = type as BGMType;
        const howl = new Howl({
          src: [path],
          loop: true,
          volume: settings.bgmVolume,
          preload: true,
        });

        bgmInstancesRef.current.set(bgmType, howl);
      });

      // Initialize SFX instances
      const sfxTracks: Record<SFXType, string> = {
        intro: '/sfx/intro.opus',
        kill: '/sfx/kill.opus',
        leaderboard: '/sfx/leaderboard.opus',
        'match-found': '/sfx/match-found.opus',
        'piece-move': '/sfx/piece-move.opus',
        'player-victory': '/sfx/player-victory.opus',
        'player-lose': '/sfx/player-lose.opus',
      };

      Object.entries(sfxTracks).forEach(([type, path]) => {
        const sfxType = type as SFXType;
        const howl = new Howl({
          src: [path],
          volume: settings.sfxVolume,
          preload: true,
        });

        sfxInstancesRef.current.set(sfxType, howl);
      });

      setIsInitialized(true);
    };

    initializeAudio();

    // Cleanup function
    return () => {
      // Stop all audio instances
      bgmInstancesRef.current.forEach((instance) => {
        instance.stop();
        instance.unload();
      });
      sfxInstancesRef.current.forEach((instance) => {
        instance.stop();
        instance.unload();
      });

      if (crossfadeTimeoutRef.current) {
        clearTimeout(crossfadeTimeoutRef.current);
      }
    };
  }, []);

  // Update volumes when settings change
  useEffect(() => {
    if (!isInitialized) return;

    // Update BGM volumes
    bgmInstancesRef.current.forEach((instance) => {
      instance.volume(settings.bgmVolume);
    });

    // Update SFX volumes
    sfxInstancesRef.current.forEach((instance) => {
      instance.volume(settings.sfxVolume);
    });
  }, [settings, isInitialized]);

  // Crossfade between BGM tracks
  const crossfadeBGM = useCallback((fromType: BGMType, toType: BGMType, duration: number = 2000) => {
    if (!isInitialized || fromType === toType) return;

    // Clear any existing crossfade timeout
    if (crossfadeTimeoutRef.current) {
      clearTimeout(crossfadeTimeoutRef.current);
    }

    const fromInstance = fromType ? bgmInstancesRef.current.get(fromType) : null;
    const toInstance = toType ? bgmInstancesRef.current.get(toType) : null;

    if (!toInstance) {
      // Just stop the current BGM if no target
      if (fromInstance && currentBGMInstanceRef.current === fromInstance) {
        fromInstance.fade(settings.bgmVolume, 0, duration);
        crossfadeTimeoutRef.current = setTimeout(() => {
          fromInstance.stop();
          currentBGMInstanceRef.current = null;
          setCurrentBGM(null);
        }, duration);
      }
      return;
    }

    // Start the new track at volume 0
    toInstance.volume(0);
    toInstance.play();

    // Crossfade
    if (fromInstance && currentBGMInstanceRef.current === fromInstance) {
      // Fade out current track
      fromInstance.fade(settings.bgmVolume, 0, duration);

      // Fade in new track
      toInstance.fade(0, settings.bgmVolume, duration);

      crossfadeTimeoutRef.current = setTimeout(() => {
        fromInstance.stop();
        currentBGMInstanceRef.current = toInstance;
        setCurrentBGM(toType);
      }, duration);
    } else {
      // No current track, just fade in the new one
      toInstance.fade(0, settings.bgmVolume, duration);
      currentBGMInstanceRef.current = toInstance;
      setCurrentBGM(toType);

      crossfadeTimeoutRef.current = setTimeout(() => {
        // Ensure volume is set correctly after fade
        toInstance.volume(settings.bgmVolume);
      }, duration);
    }
  }, [isInitialized, settings.bgmVolume]);

  // Play BGM
  const playBGM = useCallback((type: BGMType) => {
    if (!isInitialized || !type) return;

    if (currentBGM === type) return; // Already playing this track

    crossfadeBGM(currentBGM, type);
  }, [isInitialized, currentBGM, crossfadeBGM]);

  // Stop BGM
  const stopBGM = useCallback(() => {
    if (!isInitialized) return;

    crossfadeBGM(currentBGM, null);
  }, [isInitialized, currentBGM, crossfadeBGM]);

  // Play SFX
  const playSFX = useCallback((type: SFXType) => {
    if (!isInitialized || settings.sfxVolume === 0) return;

    const instance = sfxInstancesRef.current.get(type);
    if (instance) {
      // Stop any currently playing instance of this SFX to prevent overlap
      instance.stop();
      instance.play();
    }
  }, [isInitialized, settings.sfxVolume]);

  // Update BGM volume
  const setBGMVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setSettings(prev => {
      const newSettings = { ...prev, bgmVolume: clampedVolume };
      saveSettings(newSettings);
      return newSettings;
    });
  }, [saveSettings]);

  // Update SFX volume
  const setSFXVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setSettings(prev => {
      const newSettings = { ...prev, sfxVolume: clampedVolume };
      saveSettings(newSettings);
      return newSettings;
    });
  }, [saveSettings]);

  return {
    // State
    currentBGM,
    settings,
    isInitialized,

    // BGM controls
    playBGM,
    stopBGM,

    // SFX controls
    playSFX,

    // Volume controls
    setBGMVolume,
    setSFXVolume,
  };
}
