import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useSoundManager, BGMType, SFXType } from './useSoundManager';

interface SoundContextType {
  // BGM controls
  currentBGM: BGMType;
  playBGM: (type: BGMType) => void;
  stopBGM: () => void;

  // SFX controls
  playSFX: (type: SFXType) => void;

  // Volume controls
  bgmVolume: number;
  sfxVolume: number;
  setBGMVolume: (volume: number) => void;
  setSFXVolume: (volume: number) => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

interface SoundProviderProps {
  children: ReactNode;
}

export function SoundProvider({ children }: SoundProviderProps) {
  const soundManager = useSoundManager();

  const { currentBGM, settings, playBGM, stopBGM, playSFX, setBGMVolume, setSFXVolume } = soundManager;

  // Stable value: consumers re-render only when a field they get changes.
  const contextValue = useMemo<SoundContextType>(
    () => ({
      currentBGM,
      playBGM,
      stopBGM,
      playSFX,
      bgmVolume: settings.bgmVolume,
      sfxVolume: settings.sfxVolume,
      setBGMVolume,
      setSFXVolume,
    }),
    [currentBGM, playBGM, stopBGM, playSFX, settings.bgmVolume, settings.sfxVolume, setBGMVolume, setSFXVolume],
  );

  return (
    <SoundContext.Provider value={contextValue}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}
