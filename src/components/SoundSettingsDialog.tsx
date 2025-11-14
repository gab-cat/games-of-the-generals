import React from 'react';
import { Volume2, VolumeX, Music, Gamepad2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Slider } from './ui/slider';
import { useSound } from '../lib/SoundProvider';
import { cn } from '../lib/utils';

interface SoundSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SoundSettingsDialog({ isOpen, onClose }: SoundSettingsDialogProps) {
  const { bgmVolume, sfxVolume, setBGMVolume, setSFXVolume } = useSound();

  const formatVolume = (volume: number) => {
    return `${Math.round(volume * 100)}%`;
  };

  const getVolumeIcon = (volume: number) => {
    return volume === 0 ? VolumeX : Volume2;
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent className="sm:max-w-md bg-black/50 backdrop-blur-lg border border-white/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white/90">
            <Volume2 className="h-5 w-5" />
            Sound Settings
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Adjust background music and sound effects volume levels.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* BGM Volume Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-blue-400" />
                <label className="text-sm font-medium text-white/90">
                  Background Music
                </label>
              </div>
              <span className="text-xs text-white/60 font-mono">
                {formatVolume(bgmVolume)}
              </span>
            </div>

            <div className="px-2">
              <Slider
                value={[bgmVolume]}
                onValueChange={(value) => setBGMVolume(value[0])}
                max={1}
                min={0}
                step={0.01}
                className="w-full"
              />
            </div>

            <div className="flex justify-between text-xs text-white/50">
              <span>Muted</span>
              <span>Max</span>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10" />

          {/* SFX Volume Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-green-400" />
                <label className="text-sm font-medium text-white/90">
                  Sound Effects
                </label>
              </div>
              <span className="text-xs text-white/60 font-mono">
                {formatVolume(sfxVolume)}
              </span>
            </div>

            <div className="px-2">
              <Slider
                value={[sfxVolume]}
                onValueChange={(value) => setSFXVolume(value[0])}
                max={1}
                min={0}
                step={0.01}
                className="w-full"
              />
            </div>

            <div className="flex justify-between text-xs text-white/50">
              <span>Muted</span>
              <span>Max</span>
            </div>
          </div>

          {/* Volume Indicators */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Music className="h-3 w-3" />
              <span>BGM</span>
              {React.createElement(getVolumeIcon(bgmVolume), {
                className: cn(
                  "h-3 w-3",
                  bgmVolume === 0 ? "text-red-400" : "text-blue-400"
                )
              })}
            </div>

            <div className="flex items-center gap-2 text-xs text-white/60">
              <Gamepad2 className="h-3 w-3" />
              <span>SFX</span>
              {React.createElement(getVolumeIcon(sfxVolume), {
                className: cn(
                  "h-3 w-3",
                  sfxVolume === 0 ? "text-red-400" : "text-green-400"
                )
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
