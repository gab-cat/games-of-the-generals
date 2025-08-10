import { motion } from "framer-motion";

interface ErrorMessageProps {
  error: Error;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-12"
    >
      <div className="text-red-400">
        Error loading match history: {error.message}
      </div>
    </motion.div>
  );
}
