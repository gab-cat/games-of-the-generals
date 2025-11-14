import React, { createContext, useContext, ReactNode } from 'react';
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

  // State
  isInitialized: boolean;
}

const SoundContext = createContext<SoundContextType | null>(null);

interface SoundProviderProps {
  children: ReactNode;
}

export function SoundProvider({ children }: SoundProviderProps) {
  const soundManager = useSoundManager();

  const contextValue: SoundContextType = {
    // BGM controls
    currentBGM: soundManager.currentBGM,
    playBGM: soundManager.playBGM,
    stopBGM: soundManager.stopBGM,

    // SFX controls
    playSFX: soundManager.playSFX,

    // Volume controls
    bgmVolume: soundManager.settings.bgmVolume,
    sfxVolume: soundManager.settings.sfxVolume,
    setBGMVolume: soundManager.setBGMVolume,
    setSFXVolume: soundManager.setSFXVolume,

    // State
    isInitialized: soundManager.isInitialized,
  };

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
