import { MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface MessageButtonProps {
  unreadCount: number;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

export function MessageButton({
  unreadCount,
  isActive,
  onClick,
  className,
}: MessageButtonProps) {
  const label =
    unreadCount > 0 ? `Messages, ${unreadCount} unread` : "Messages";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isActive}
      title="Messages"
      className={cn(
        "relative h-9 w-9",
        isActive && "bg-white/[0.08]",
        className,
      )}
    >
      <MessageCircle className="!size-[18px]" />
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold tabular-nums text-primary-foreground ring-2 ring-background"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
