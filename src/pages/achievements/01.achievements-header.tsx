import { motion } from "framer-motion";
import { EASE, Painting } from "@/components/season/art";
import { Skeleton } from "@/components/ui/skeleton";

interface AchievementsHeaderProps {
  unlockedCount: number;
  totalCount: number;
}

/** The page title over the medal ceremony painting, with the count at poster size. */
export function AchievementsHeader({
  unlockedCount,
  totalCount,
}: AchievementsHeaderProps) {
  return (
    <Painting crop="ceremony" fade="left" className="rounded-lg">
      {/* Phones show less of the painting, so darken it under the text */}
      <div aria-hidden="true" className="absolute inset-0 bg-black/45 sm:hidden" />
      <div className="relative space-y-3 px-5 py-8 sm:px-10 sm:py-12">
        <h1 className="font-display text-2xl font-semibold text-white sm:text-3xl">
          Achievements
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="text-7xl font-bold leading-[0.9] tracking-[-0.04em] text-white sm:text-9xl"
        >
          {unlockedCount}{" "}
          <span className="text-white/50">of {totalCount}</span>
        </motion.p>
        <p className="max-w-sm text-base text-white">
          {unlockedCount === 0
            ? "Ribbons earned. Win your first game to earn the first one."
            : "Ribbons earned. The outlines fill in as you get closer."}
        </p>
      </div>
    </Painting>
  );
}

/** Loading shape of the header band. */
export function AchievementsHeaderSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card px-5 py-8 sm:px-10 sm:py-12">
      <h1 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
        Achievements
      </h1>
      <Skeleton className="mt-3 h-16 w-56 sm:h-28 sm:w-96" />
      <Skeleton className="mt-3 h-4 w-64" />
    </div>
  );
}
