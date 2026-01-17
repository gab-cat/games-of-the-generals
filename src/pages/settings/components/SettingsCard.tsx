import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface SettingsCardProps extends Omit<HTMLMotionProps<"div">, "title"> {
  children: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  variant?: "default" | "danger";
  delay?: number;
}

export function SettingsCard({
  children,
  title,
  description,
  icon,
  action,
  className,
  variant = "default",
  delay = 0,
  ...props
}: SettingsCardProps) {
  const isDanger = variant === "danger";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        "relative group overflow-hidden rounded-sm border backdrop-blur-sm transition-all duration-300",
        isDanger
          ? "bg-red-500/5 border-red-500/20 hover:border-red-500/30"
          : "bg-zinc-900/40 border-white/5 hover:border-white/10",
        className,
      )}
      {...props}
    >
      {/* Decorative Corners */}
      <div
        className={cn(
          "absolute top-0 left-0 w-2 h-2 border-t border-l transition-colors",
          isDanger
            ? "border-red-500/30 group-hover:border-red-500/50"
            : "border-white/20 group-hover:border-white/40",
        )}
      />
      <div
        className={cn(
          "absolute bottom-0 right-0 w-2 h-2 border-b border-r transition-colors",
          isDanger
            ? "border-red-500/30 group-hover:border-red-500/50"
            : "border-white/20 group-hover:border-white/40",
        )}
      />

      {/* Header */}
      {(title || icon) && (
        <div className="p-6 pb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {icon && (
              <div
                className={cn(
                  "p-2 rounded-sm border",
                  isDanger
                    ? "bg-red-500/10 border-red-500/20 text-red-400"
                    : "bg-blue-500/10 border-blue-500/20 text-blue-400",
                )}
              >
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3
                  className={cn(
                    "font-display text-lg font-medium tracking-wide",
                    isDanger ? "text-red-400" : "text-white",
                  )}
                >
                  {title}
                </h3>
              )}
              {description && (
                <p className="mt-1 text-xs text-zinc-500 font-mono leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}

      {/* Content */}
      <div className={cn("p-6", (title || icon) && "pt-2")}>{children}</div>
    </motion.div>
  );
}
