import { useState, useEffect, useCallback, useRef } from "react";
import type { Howl } from "howler";

export type BGMType = "main" | "setup" | "battle" | null;
export type SFXType =
  | "intro"
  | "kill"
  | "leaderboard"
  | "match-found"
  | "piece-move"
  | "player-victory"
  | "player-lose";

interface SoundSettings {
  bgmVolume: number;
  sfxVolume: number;
}

const DEFAULT_SETTINGS: SoundSettings = {
  bgmVolume: 0.3,
  sfxVolume: 0.7,
};

const SETTINGS_KEY = "sound-settings";
const CROSSFADE_MS = 2000;

const BGM_TRACKS: Record<NonNullable<BGMType>, string> = {
  main: "/bgm/main.opus",
  setup: "/bgm/setup.opus",
  battle: "/bgm/battle.opus",
};

const SFX_TRACKS: Record<SFXType, string> = {
  intro: "/sfx/intro.opus",
  kill: "/sfx/kill.opus",
  leaderboard: "/sfx/leaderboard.opus",
  "match-found": "/sfx/match-found.opus",
  "piece-move": "/sfx/piece-move.opus",
  "player-victory": "/sfx/player-victory.opus",
  "player-lose": "/sfx/player-lose.opus",
};

// Game sounds, fetched once the player first interacts so the first move or
// battle doesn't wait on a download. The rest load the first time they play.
const WARM_SFX: SFXType[] = [
  "piece-move",
  "kill",
  "match-found",
  "player-victory",
  "player-lose",
];

// Howler (about 30 KB) loads on first use, not with the app shell.
let howlCtor: Promise<typeof Howl> | null = null;
function loadHowl() {
  howlCtor ??= import("howler").then((m) => m.Howl);
  return howlCtor;
}

function readSettings(): SoundSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {
    // Private mode or bad JSON: use the defaults.
  }
  return DEFAULT_SETTINGS;
}

// Sounds are created when first needed. Before, every page load fetched and
// decoded all three music tracks (2.1 MB, roughly 100 MB of decoded audio on a
// phone) and every effect, even for players who never hear them.
export function useSoundManager() {
  const [settings, setSettings] = useState<SoundSettings>(readSettings);
  const [currentBGM, setCurrentBGM] = useState<BGMType>(null);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const bgmRef = useRef(new Map<NonNullable<BGMType>, Howl>());
  const sfxRef = useRef(new Map<SFXType, Howl>());
  // The track the current page asked for, and the one actually playing.
  // `howl` is null while the track is still loading.
  const wantedBGMRef = useRef<BGMType>(null);
  const playingRef = useRef<{
    type: NonNullable<BGMType>;
    howl: Howl | null;
  } | null>(null);
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());
  const unmountedRef = useRef(false);

  const getBGM = useCallback(async (type: NonNullable<BGMType>) => {
    const HowlClass = await loadHowl();
    let howl = bgmRef.current.get(type);
    if (!howl) {
      howl = new HowlClass({ src: [BGM_TRACKS[type]], loop: true, volume: 0 });
      bgmRef.current.set(type, howl);
    }
    return howl;
  }, []);

  const getSFX = useCallback(async (type: SFXType) => {
    const HowlClass = await loadHowl();
    let howl = sfxRef.current.get(type);
    if (!howl) {
      howl = new HowlClass({
        src: [SFX_TRACKS[type]],
        volume: settingsRef.current.sfxVolume,
      });
      sfxRef.current.set(type, howl);
    }
    return howl;
  }, []);

  // Make the playing track match the wanted one: fade the old track out and
  // free it, then load and fade in the new one. Music at volume 0 never loads.
  const syncBGM = useCallback(async () => {
    const target =
      settingsRef.current.bgmVolume > 0 ? wantedBGMRef.current : null;
    const playing = playingRef.current;
    if ((playing?.type ?? null) === target) return;

    if (playing) {
      playingRef.current = null;
      const old = playing.howl;
      if (old) {
        old.fade(old.volume(), 0, CROSSFADE_MS);
        const timer = setTimeout(() => {
          timersRef.current.delete(timer);
          // The player came back to this track during the fade: keep it.
          if (playingRef.current?.type === playing.type) return;
          old.stop();
          old.unload();
          bgmRef.current.delete(playing.type);
        }, CROSSFADE_MS);
        timersRef.current.add(timer);
      }
    }

    setCurrentBGM(target);
    if (!target) return;

    const entry: { type: NonNullable<BGMType>; howl: Howl | null } = {
      type: target,
      howl: null,
    };
    playingRef.current = entry;
    const howl = await getBGM(target);
    // The page may have asked for another track while this one loaded.
    if (unmountedRef.current || playingRef.current !== entry) return;
    entry.howl = howl;
    if (!howl.playing()) {
      howl.volume(0);
      howl.play();
    }
    howl.fade(howl.volume(), settingsRef.current.bgmVolume, CROSSFADE_MS);
  }, [getBGM]);

  // Volume changes apply to loaded sounds, and start or stop the music when
  // its volume crosses zero.
  useEffect(() => {
    playingRef.current?.howl?.volume(settings.bgmVolume);
    sfxRef.current.forEach((howl) => howl.volume(settings.sfxVolume));
    void syncBGM();
  }, [settings, syncBGM]);

  // Warm the game sounds after the first tap or key press, when the browser
  // is idle. Visitors who only look at the sign-in page download none of it.
  useEffect(() => {
    const warm = () => {
      window.removeEventListener("pointerdown", warm);
      window.removeEventListener("keydown", warm);
      const run = () => {
        if (unmountedRef.current || settingsRef.current.sfxVolume === 0) return;
        WARM_SFX.forEach((type) => void getSFX(type));
      };
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(run, { timeout: 3000 });
      } else {
        setTimeout(run, 1000);
      }
    };
    window.addEventListener("pointerdown", warm, { passive: true });
    window.addEventListener("keydown", warm);
    return () => {
      window.removeEventListener("pointerdown", warm);
      window.removeEventListener("keydown", warm);
    };
  }, [getSFX]);

  useEffect(() => {
    unmountedRef.current = false;
    const bgm = bgmRef.current;
    const sfx = sfxRef.current;
    const timers = timersRef.current;
    return () => {
      unmountedRef.current = true;
      timers.forEach(clearTimeout);
      timers.clear();
      bgm.forEach((howl) => howl.unload());
      sfx.forEach((howl) => howl.unload());
      bgm.clear();
      sfx.clear();
      playingRef.current = null;
    };
  }, []);

  const saveSettings = useCallback((next: SoundSettings) => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      // Storage full or blocked: the setting still applies for this visit.
    }
  }, []);

  const playBGM = useCallback(
    (type: BGMType) => {
      if (!type) return;
      wantedBGMRef.current = type;
      void syncBGM();
    },
    [syncBGM],
  );

  const stopBGM = useCallback(() => {
    wantedBGMRef.current = null;
    void syncBGM();
  }, [syncBGM]);

  const playSFX = useCallback(
    (type: SFXType) => {
      if (settingsRef.current.sfxVolume === 0) return;
      const loaded = sfxRef.current.get(type);
      if (loaded) {
        // Restart instead of overlapping the same sound.
        loaded.stop();
        loaded.play();
        return;
      }
      // Howler queues the play until the file has loaded.
      void getSFX(type).then((howl) => {
        if (!unmountedRef.current) howl.play();
      });
    },
    [getSFX],
  );

  const setBGMVolume = useCallback(
    (volume: number) => {
      const clamped = Math.max(0, Math.min(1, volume));
      setSettings((prev) => {
        const next = { ...prev, bgmVolume: clamped };
        saveSettings(next);
        return next;
      });
    },
    [saveSettings],
  );

  const setSFXVolume = useCallback(
    (volume: number) => {
      const clamped = Math.max(0, Math.min(1, volume));
      setSettings((prev) => {
        const next = { ...prev, sfxVolume: clamped };
        saveSettings(next);
        return next;
      });
    },
    [saveSettings],
  );

  return {
    currentBGM,
    settings,
    playBGM,
    stopBGM,
    playSFX,
    setBGMVolume,
    setSFXVolume,
  };
}
