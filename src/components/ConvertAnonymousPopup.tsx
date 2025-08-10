
import { useEffect, useState } from "react";
import { useConvexQuery } from "../lib/convex-query-hooks";
import { api } from "../../convex/_generated/api";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { UserPlus } from "lucide-react";

export function ConvertAnonymousPopup() {
  const { data: userSettings } = useConvexQuery(api.settings.getUserSettings);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (userSettings?.isAnonymous) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [userSettings?.isAnonymous]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      className="fixed bottom-6 left-6 z-50"
    >
      <div className="bg-blue-900/90 border border-blue-400 rounded-lg shadow-lg p-4 flex items-center gap-3">
        <UserPlus className="w-6 h-6 text-blue-300" />
        <div className="flex-1">
          <div className="text-white font-semibold text-sm mb-1">Complete your account</div>
          <div className="text-blue-100 text-xs">Set an email and password to save your progress and play on any device.</div>
        </div>
        <Button
          className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
          asChild
        >
          <Link to="/settings" search={{ convert: "1" }}>
            Convert
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
