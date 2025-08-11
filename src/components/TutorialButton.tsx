import { useState, useEffect } from "react";
import { HelpCircle, BookOpen } from "lucide-react";
import { Button } from "./ui/button";
import { TutorialModal } from "./TutorialModal";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface TutorialButtonProps {
  variant?: "icon" | "text";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TutorialButton({ 
  variant = "icon", 
  size = "md", 
  className 
}: TutorialButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const tutorialStatus = useQuery(api.profiles.checkTutorialStatus);
  const markTutorialCompleted = useMutation(api.profiles.markTutorialCompleted);

  // Automatically show tutorial if not completed
  useEffect(() => {
    if (tutorialStatus && !tutorialStatus.tutorialCompletedAt) {
      setIsModalOpen(true);
    }
  }, [tutorialStatus]);

  const handleOpenTutorial = () => {
    setIsModalOpen(true);
  };

  const handleCloseTutorial = () => {
    setIsModalOpen(false);
  };

  const handleCompleteTutorial = () => {
    markTutorialCompleted()
      .then(() => {
        toast.success("Tutorial completed! Welcome to the battle, General!");
      })
      .catch((error) => {
        console.error("Failed to mark tutorial as completed:", error);
        // Don't show error toast as it's not critical
      });
    setIsModalOpen(false);
  };

  const buttonSizeClass = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-12 w-12"
  }[size];

  const iconSizeClass = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  }[size];

  if (variant === "icon") {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenTutorial}
          className={`${buttonSizeClass} bg-white/10 border-white/20 text-white/90 hover:bg-white/20 hover:text-white rounded-full p-0 ${className}`}
          title="View Tutorial"
        >
          <HelpCircle className={iconSizeClass} />
        </Button>
        
        <TutorialModal
          isOpen={isModalOpen}
          onClose={handleCloseTutorial}
          onComplete={handleCompleteTutorial}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={handleOpenTutorial}
        className={`bg-white/10 border-white/20 text-white/90 hover:bg-white/20 hover:text-white ${className}`}
      >
        <BookOpen className="h-4 w-4 mr-2" />
        Tutorial
      </Button>
      
      <TutorialModal
        isOpen={isModalOpen}
        onClose={handleCloseTutorial}
        onComplete={handleCompleteTutorial}
      />
    </>
  );
}
