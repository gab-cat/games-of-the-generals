import { useState, useEffect } from "react";
import { useConvexQuery } from "./convex-query-hooks";
import { api } from "../../convex/_generated/api";

export function useTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasCheckedInitialState, setHasCheckedInitialState] = useState(false);

  // Get tutorial status from the database
  const { data: tutorialStatus, isLoading } = useConvexQuery(
    api.profiles.checkTutorialStatus,
    {}
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
