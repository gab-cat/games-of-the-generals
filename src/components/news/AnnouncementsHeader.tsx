import { format } from "date-fns";
import { motion } from "framer-motion";
import { EASE } from "@/components/season/art";

/** The season the game is in. Shown on the news dateline. */
export const CURRENT_SEASON = "Season 3";

/**
 * The news nameplate: "News" set like a broadsheet's name, over a double rule
 * with today's date and the season on the line.
 */
export function AnnouncementsHeader({
  actions,
}: {
  actions?: React.ReactNode;
}) {
  const today = format(new Date(), "EEEE, d MMMM yyyy");
  return (
    <header>
      <div className="flex items-end justify-between gap-4">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="font-display text-[88px] font-bold leading-[0.85] tracking-tighter text-foreground sm:text-[160px]"
        >
          News
        </motion.h1>
        {actions && <div className="shrink-0 pb-2">{actions}</div>}
      </div>
      <div className="mt-4 border-y-2 border-foreground py-2">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-sm text-foreground">
          <time dateTime={format(new Date(), "yyyy-MM-dd")}>{today}</time>
          <span className="font-semibold">{CURRENT_SEASON}</span>
          <span className="hidden sm:inline">
            Updates from the Games of the Generals team
          </span>
        </div>
      </div>
    </header>
  );
}
