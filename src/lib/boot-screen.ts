/*
 * The boot screen is the Season 3 title card in index.html (#boot). It paints
 * before any script runs and stays on top while React renders into #root
 * underneath. Every full-screen loader, and every loader that mounts while the
 * app is still starting, holds it instead of drawing its own, so a player sees
 * one title card from the first paint to the first real page instead of a
 * chain of different spinners. When nothing holds it, it fades out.
 */

const FADE_MS = 250;
// Lets a Suspense fallback hand over to the next one without the card flickering.
const HANDOFF_MS = 60;

let holds = 0;
let hideTimer: number | undefined;
let removeTimer: number | undefined;
let started = false;

function bootElement() {
  return typeof document === "undefined" ? null : document.getElementById("boot");
}

/** True until the boot screen has faded out for the first time. */
export function isAppStarting() {
  return !started && bootElement() !== null;
}

/** Keeps the boot screen up until the returned function is called. */
export function holdBootScreen(): () => void {
  holds++;
  window.clearTimeout(hideTimer);
  window.clearTimeout(removeTimer);
  const boot = bootElement();
  if (boot) {
    boot.hidden = false;
    boot.classList.remove("is-leaving");
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    holds--;
    releaseBootScreen();
  };
}

/** Fades the boot screen out once nothing is holding it. */
export function releaseBootScreen(immediately = false) {
  if (holds > 0 && !immediately) return;
  window.clearTimeout(hideTimer);
  const hide = () => {
    if (holds > 0 && !immediately) return;
    const boot = bootElement();
    if (!boot) return;
    started = true;
    boot.classList.add("is-leaving");
    removeTimer = window.setTimeout(() => {
      if (holds === 0 || immediately) boot.hidden = true;
    }, FADE_MS);
  };
  if (immediately) hide();
  else hideTimer = window.setTimeout(hide, HANDOFF_MS);
}
