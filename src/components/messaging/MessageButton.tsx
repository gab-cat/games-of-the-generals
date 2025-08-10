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
          "relative rounded-full py-5 px-6 transition-all duration-200",
          isActive 
            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg" 
            : "bg-white/10 hover:bg-white/20 text-white/90 border border-white/20"
        )}
      >
        <MessageCircle className="w-5 h-5" />
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -top-1 -right-1"
          >
            <Badge 
              variant="destructive" 
              className="min-w-[18px] h-[18px] text-xs flex items-center justify-center p-0 bg-red-500 hover:bg-red-500"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          </motion.div>
        )}
      </Button>
    </motion.div>
  );
}
