import { motion } from "framer-motion";

export function LoadingSpinner() {
  return (
    <div className="flex justify-center py-6 sm:py-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="h-6 w-6 sm:h-8 sm:w-8 border-2 border-blue-400 border-t-transparent rounded-full"
      />
    </div>
  );
}
