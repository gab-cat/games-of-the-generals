import type { Transition, Variants } from "framer-motion";

/**
 * Shared motion presets (Season 3). Short, calm, and the same everywhere.
 * `MotionConfig reducedMotion="user"` at the root turns transforms off for
 * people who ask for reduced motion, so these stay safe to use anywhere.
 */
export const easeOut: Transition["ease"] = [0.16, 1, 0.3, 1];

/** One element rising in: page headers, cards, panels. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: easeOut } },
};

/** Parent of a staggered list or grid. Children use `fadeUp`. */
export const stagger = (step = 0.04, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: step, delayChildren: delay } },
});

/** Spread onto a motion element to rise in once on mount. */
export const riseIn = {
  initial: "hidden",
  animate: "show",
  variants: fadeUp,
} as const;
