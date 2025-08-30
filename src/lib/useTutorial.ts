import { useState, useEffect } from "react";
import { useConvexQueryWithOptions } from "./convex-query-hooks";
import { api } from "../../convex/_generated/api";

export function useTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasCheckedInitialState, setHasCheckedInitialState] = useState(false);

  // Get tutorial status from the database - tutorial status doesn't change frequently
  const { data: tutorialStatus, isLoading } = useConvexQueryWithOptions(
    api.profiles.checkTutorialStatus,
    {},
    {
      staleTime: 300000, // 5 minutes - tutorial status doesn't change often
      gcTime: 600000, // 10 minutes cache
    }
  );

  // Show tutorial automatically on first login
  useEffect(() => {
    if (!isLoading && tutorialStatus && !hasCheckedInitialState) {
      if (tutorialStatus.isFirstLogin && !tutorialStatus.hasSeenTutorial) {
        setShowTutorial(true);
      }
      setHasCheckedInitialState(true);
    }
  }, [tutorialStatus, isLoading, hasCheckedInitialState]);

  const openTutorial = () => {
    setShowTutorial(true);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
  };

  return {
    showTutorial,
    openTutorial,
    closeTutorial,
    tutorialStatus,
    isLoading,
  };
}
