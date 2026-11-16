import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { riseIn } from "@/lib/motion";

interface EmptyStateProps {
  /** What would be here: "No open lobbies". */
  title: React.ReactNode;
  /** One line on how it fills up. */
  body?: React.ReactNode;
  /** The one action that fills it. */
  action?: React.ReactNode;
  /** Optional real visual (a piece, an avatar row). Never an icon in a tinted square. */
  visual?: React.ReactNode;
  className?: string;
}

/** Empty and filtered-to-nothing states. See DESIGN.md. */
export function EmptyState({
  title,
  body,
  action,
  visual,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      {...riseIn}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong px-6 py-12 text-center",
        className,
      )}
    >
      {visual ? <div className="mb-4">{visual}</div> : null}
      <p className="text-base font-medium text-foreground">{title}</p>
      {body ? (
        <p className="mt-1 max-w-sm text-sm text-foreground/75">{body}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </motion.div>
  );
}
