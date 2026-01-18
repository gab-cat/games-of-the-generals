import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

interface MessageButtonProps {
  unreadCount: number;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

export function MessageButton({ unreadCount, isActive, onClick, className }: MessageButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn("relative", className)}
    >
      <Button
        variant={isActive ? "default" : "ghost"}
        size="sm"
        onClick={onClick}
        className={cn(
          "relative rounded-full w-9 h-9 p-0 flex items-center justify-center transition-all duration-200",
          isActive 
            ? "bg-gray-400/50 hover:bg-gray-100 text-white shadow-lg" 
            : "bg-white/5 hover:bg-white/10 text-white/90 border border-white/10"
        )}
      >
        <MessageCircle className="w-5 h-5" />
        
        {/* Subtle pulsing ring for unread messages */}
        {unreadCount > 0 && !isActive && (
          <motion.div
            className="absolute inset-0 rounded-full border border-blue-400/30"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{
              type: "spring", 
              stiffness: 300, 
              damping: 25
            }}
            className="absolute -top-1 -right-1"
          >
            <Badge 
              variant="destructive" 
              className="min-w-[18px] h-[18px] text-xs flex items-center justify-center p-0 bg-red-500 hover:bg-red-500 shadow-lg border border-white/20"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          </motion.div>
        )}
      </Button>
    </motion.div>
  );
}
