import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Slider } from "./ui/slider";
import { useSound } from "../lib/SoundProvider";
import { Button } from "./ui/button";

interface SoundSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VolumeRowProps {
  id: string;
  label: string;
  help: string;
  value: number;
  onChange: (value: number) => void;
}

function VolumeRow({ id, label, help, value, onChange }: VolumeRowProps) {
  const percent = Math.round(value * 100);
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <label
            id={`${id}-label`}
            className="block text-sm font-medium text-foreground"
          >
            {label}
          </label>
          <span className="text-xs text-foreground/70">{help}</span>
        </div>
        <span
          className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground"
          aria-hidden="true"
        >
          {percent === 0 ? "Off" : `${percent}%`}
        </span>
      </div>
      {/* A 40px tall hit area so the thumb is easy to grab on a phone */}
      <div className="flex h-10 items-center">
        <Slider
          aria-labelledby={`${id}-label`}
          value={[value]}
          onValueChange={(v) => onChange(v[0])}
          max={1}
          min={0}
          step={0.01}
          className="w-full"
        />
      </div>
    </div>
  );
}

export function SoundSettingsDialog({
  isOpen,
  onClose,
}: SoundSettingsDialogProps) {
  const { bgmVolume, sfxVolume, setBGMVolume, setSFXVolume } = useSound();

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sound</DialogTitle>
          <DialogDescription>
            Changes apply right away and are saved on this device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <VolumeRow
            id="sound-music"
            label="Music"
            help="Background music"
            value={bgmVolume}
            onChange={setBGMVolume}
          />
          <VolumeRow
            id="sound-effects"
            label="Sound effects"
            help="Moves, captures and alerts"
            value={sfxVolume}
            onChange={setSFXVolume}
          />
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
