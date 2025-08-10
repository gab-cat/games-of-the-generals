import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "../../components/ui/button";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  // Calculate which pages to show
  const getVisiblePages = () => {
    const delta = 1; // Number of pages to show on each side of current page
    const rangeWithDots = [];

    // Always include first page
    if (currentPage - delta > 1) {
      rangeWithDots.push(0);
      if (currentPage - delta > 2) {
        rangeWithDots.push('...');
      }
    }

    // Include pages around current page
    for (let i = Math.max(0, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      rangeWithDots.push(i);
    }

    // Always include last page
    if (currentPage + delta < totalPages - 2) {
      rangeWithDots.push('...');
    }
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push(totalPages - 1);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2 mt-6 sm:mt-8"
    >
      {/* Mobile: Simple prev/next with page info */}
      <div className="flex sm:hidden items-center gap-3 w-full">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20 disabled:opacity-50 flex-1"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        
        <span className="text-sm text-white/60 px-3 whitespace-nowrap">
          {currentPage + 1} / {totalPages}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage === totalPages - 1}
          className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20 disabled:opacity-50 flex-1"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Desktop: Full pagination */}
      <div className="hidden sm:flex items-center gap-1">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          disabled={currentPage === 0}
          className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        {visiblePages.map((page, index) => (
          page === '...' ? (
            <div key={`dots-${index}`} className="px-2">
              <MoreHorizontal className="h-4 w-4 text-white/40" />
            </div>
          ) : (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page as number)}
              className={
                currentPage === page
                  ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                  : "bg-white/10 border-white/20 text-white/90 hover:bg-white/20"
              }
            >
              {(page as number) + 1}
            </Button>
          )
        ))}

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          disabled={currentPage === totalPages - 1}
          className="bg-white/10 border-white/20 text-white/90 hover:bg-white/20 disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Page info for desktop */}
      <div className="hidden sm:block text-xs text-white/50 ml-4">
        Showing page {currentPage + 1} of {totalPages}
      </div>
    </motion.div>
  );
}
