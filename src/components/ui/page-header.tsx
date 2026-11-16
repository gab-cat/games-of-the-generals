import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { riseIn } from "@/lib/motion";

interface PageHeaderProps {
  /** The page name, in sentence case. No eyebrow above it. */
  title: React.ReactNode;
  /** One plain line on what this page is for. Optional. */
  description?: React.ReactNode;
  /** Buttons or a small stat on the right (below the title on phones). */
  actions?: React.ReactNode;
  className?: string;
}

/** The heading block every top-level page starts with. See DESIGN.md. */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <motion.header
      {...riseIn}
      className={cn(
        "mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-foreground/80 sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </motion.header>
  );
}

interface SectionHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  as?: "h2" | "h3";
}

/** A heading inside a page: "Open lobbies", "Recent games". */
export function SectionHeader({
  title,
  description,
  actions,
  className,
  as: Tag = "h2",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2",
        className,
      )}
    >
      <div className="min-w-0">
        <Tag className="text-base font-semibold text-foreground sm:text-lg">
          {title}
        </Tag>
        {description ? (
          <p className="mt-0.5 text-sm text-foreground/75">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
