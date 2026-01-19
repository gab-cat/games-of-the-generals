import React from "react";
import { Volume2, VolumeX, Music, Gamepad2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Slider } from "./ui/slider";
import { useSound } from "../lib/SoundProvider";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";

interface SoundSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SoundSettingsDialog({
  isOpen,
  onClose,
}: SoundSettingsDialogProps) {
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
      <DialogContent className="sm:max-w-md bg-zinc-950 border border-amber-500/20 backdrop-blur-xl shadow-2xl p-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-50" />

        <DialogHeader className="p-6 bg-zinc-900/30 border-b border-white/5 space-y-1">
          <DialogTitle className="flex items-center gap-3 text-white font-display uppercase tracking-widest text-lg">
            <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Volume2 className="h-4 w-4 text-amber-500" />
            </div>
            Audio Configuration
          </DialogTitle>
          <DialogDescription className="text-zinc-500 font-mono text-xs uppercase tracking-wider ml-11">
            Adjust system audio output levels
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-8">
          {/* BGM Volume Control */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm bg-zinc-900 flex items-center justify-center border border-white/5 group-hover:border-amber-500/30 transition-colors">
                  <Music className="h-4 w-4 text-zinc-400" />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-100 uppercase tracking-wide block">
                    BGM_CHANNEL
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono uppercase">
                    Background Ambience
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-zinc-900/50 px-2 py-1 rounded border border-white/5">
                <span className="text-xs font-mono text-amber-500 w-8 text-right font-bold">
                  {formatVolume(bgmVolume)}
                </span>
              </div>
            </div>

            <div className="relative pt-2">
              <div className="absolute -top-1 left-0 w-full flex justify-between px-1">
                {[0, 25, 50, 75, 100].map((tick) => (
                  <div key={tick} className="w-px h-1 bg-white/10" />
                ))}
              </div>
              <Slider
                value={[bgmVolume]}
                onValueChange={(value) => setBGMVolume(value[0])}
                max={1}
                min={0}
                step={0.01}
                className="w-full"
              />
            </div>
          </div>

          {/* SFX Volume Control */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-sm bg-zinc-900 flex items-center justify-center border border-white/5 group-hover:border-amber-500/30 transition-colors">
                  <Gamepad2 className="h-4 w-4 text-zinc-400" />
                </div>
                <div>
                  <label className="text-sm font-bold text-zinc-100 uppercase tracking-wide block">
                    SFX_CHANNEL
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono uppercase">
                    System Effects
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-zinc-900/50 px-2 py-1 rounded border border-white/5">
                <span className="text-xs font-mono text-amber-500 w-8 text-right font-bold">
                  {formatVolume(sfxVolume)}
                </span>
              </div>
            </div>

            <div className="relative pt-2">
              <div className="absolute -top-1 left-0 w-full flex justify-between px-1">
                {[0, 25, 50, 75, 100].map((tick) => (
                  <div key={tick} className="w-px h-1 bg-white/10" />
                ))}
              </div>
              <Slider
                value={[sfxVolume]}
                onValueChange={(value) => setSFXVolume(value[0])}
                max={1}
                min={0}
                step={0.01}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Footer / Info */}
        <div className="px-6 py-4 bg-zinc-900/30 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              Audio Driver Active
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 text-xs font-mono uppercase text-zinc-400 hover:text-white"
          >
            Close Panel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
