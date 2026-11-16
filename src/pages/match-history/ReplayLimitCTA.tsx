import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { riseIn } from "@/lib/motion";

/** Shown to free accounts. Limits match convex/games.ts (1, 50, 100). */
export function ReplayLimitCTA() {
  const navigate = useNavigate();

  return (
    <motion.div
      {...riseIn}
      className="mb-6 flex flex-col gap-4 rounded-lg border border-gold-500/30 bg-gold-500/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div>
        <h2 className="text-sm font-medium text-foreground">
          Free accounts keep your last game only
        </h2>
        <p className="mt-1 text-sm text-foreground/80">
          Pro keeps your last 50 games and Pro+ keeps 100.
        </p>
      </div>
      <Button
        className="shrink-0"
        onClick={() =>
          navigate({ to: "/pricing", search: { donation: undefined } })
        }
      >
        See plans
      </Button>
    </motion.div>
  );
}
