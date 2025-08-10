import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../components/ui/button";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <motion.div 
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="flex items-center gap-2"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0}
        className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20 disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-white/60">
        Page {currentPage + 1} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
        disabled={currentPage === totalPages - 1}
        className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20 disabled:opacity-50"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}
