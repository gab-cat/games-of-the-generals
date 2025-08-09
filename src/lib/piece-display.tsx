import React from "react";
import { 
  Flag, 
  Eye, 
  User, 
  Star, 
  Shield, 
  Square,
  Triangle,
  Asterisk
} from "lucide-react";

export interface PieceDisplayOptions {
  showLabel?: boolean;
  size?: "small" | "medium" | "large";
  isOpponent?: boolean;
}

export function getPieceDisplay(piece: string, options: PieceDisplayOptions = {}): React.ReactElement {
  const { showLabel = false, size = "small", isOpponent = false } = options;
  
  if (isOpponent) {
    const iconSize = size === "large" ? "w-6 h-6" : size === "medium" ? "w-5 h-5" : "w-5 h-5";
    return <Square className={iconSize} fill="currentColor" />;
  }

  // Size classes for icons
  const iconSizes = {
    small: "w-5 h-5",
    medium: "w-6 h-6", 
    large: "w-8 h-8"
  };
  
  const starSizes = {
    small: "w-3 h-3",
    medium: "w-4 h-4",
    large: "w-5 h-5"
  };
  
  const triangleSizes = {
    small: "w-4 h-4",
    medium: "w-5 h-5",
    large: "w-6 h-6"
  };
  
  const asteriskSizes = {
    small: "w-5 h-5",
    medium: "w-7 h-7",
    large: "w-8 h-8"
  };

  const iconSize = iconSizes[size];
  const starSize = starSizes[size];
  const triangleSize = triangleSizes[size];
  const asteriskSize = asteriskSizes[size];

  const createPieceElement = (icon: React.ReactElement, label: string) => {
    if (showLabel) {
      return (
        <div className="flex flex-col items-center justify-center">
          {icon}
          <div className="text-xs mt-1">{label}</div>
        </div>
      );
    }
    return icon;
  };

  const pieceElements: Record<string, () => React.ReactElement> = {
    "Flag": () => createPieceElement(
      <Flag className={iconSize} />,
      "Flag"
    ),
    "Spy": () => createPieceElement(
      <Eye className={iconSize} />,
      "Spy"
    ),
    "Private": () => createPieceElement(
      <User className={iconSize} />,
      "Private"
    ),
    "Sergeant": () => createPieceElement(
      <Shield className={iconSize}  />,
      "Sergeant"
    ),
    "2nd Lieutenant": () => createPieceElement(
      <Triangle className={triangleSize} fill="currentColor" />,
      "2nd Lt"
    ),
    "1st Lieutenant": () => {
      const iconElement = (
        <div className="flex gap-1">
          <Triangle className={starSize} fill="currentColor" />
          <Triangle className={starSize} fill="currentColor" />
        </div>
      );
      return createPieceElement(iconElement, "1st Lt");
    },
    "Captain": () => {
      const iconElement = (
        <div className="flex flex-col items-center gap-0.5">
          <Triangle className={starSize} fill="currentColor" />
          <div className="flex gap-1">
            <Triangle className={starSize} fill="currentColor" />
            <Triangle className={starSize} fill="currentColor" />
          </div>
        </div>
      );
      return createPieceElement(iconElement, "Captain");
    },
    "Major": () => createPieceElement(
      <Asterisk className={iconSize} />,
      "Major"
    ),
    "Lieutenant Colonel": () => {
      const iconElement = (
        <div className="flex">
          <Asterisk className={asteriskSize} />
          <Asterisk className={asteriskSize} />
        </div>
      );
      return createPieceElement(iconElement, "Lt Col");
    },
    "Colonel": () => {
      const iconElement = (
        <div className="flex flex-col items-center gap-0">
          <Asterisk className={asteriskSize} />
          <div className="flex gap-0 -mt-2 leading-0">
            <Asterisk className={asteriskSize} />
            <Asterisk className={asteriskSize} />
          </div>
        </div>
      );
      return createPieceElement(iconElement, "Colonel");
    },
    "1 Star General": () => {
      if (showLabel) {
        return createPieceElement(
          <Star className={iconSize} fill="currentColor" />,
          "1 Star"
        );
      } else {
        return (
          <div className="flex items-center gap-0.5">
            <span className="text-xs font-bold">1</span>
            <Star className={starSize} fill="currentColor" />
          </div>
        );
      }
    },
    "2 Star General": () => {
      if (showLabel) {
        const iconElement = (
          <div className="flex gap-1">
            <Star className={starSize} fill="currentColor" />
            <Star className={starSize} fill="currentColor" />
          </div>
        );
        return createPieceElement(iconElement, "2 Star");
      } else {
        return (
          <div className="flex items-center gap-0.5">
            <span className="text-xs font-bold">2</span>
            <Star className={starSize} fill="currentColor" />
          </div>
        );
      }
    },
    "3 Star General": () => {
      if (showLabel) {
        const iconElement = (
          <div className="flex flex-col items-center gap-0.5">
            <Star className={starSize} fill="currentColor" />
            <div className="flex gap-1">
              <Star className={starSize} fill="currentColor" />
              <Star className={starSize} fill="currentColor" />
            </div>
          </div>
        );
        return createPieceElement(iconElement, "3 Star");
      } else {
        return (
          <div className="flex items-center gap-0.5">
            <span className="text-xs font-bold">3</span>
            <Star className={starSize} fill="currentColor" />
          </div>
        );
      }
    },
    "4 Star General": () => {
      if (showLabel) {
        const iconElement = (
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex gap-1">
              <Star className={starSize} fill="currentColor" />
              <Star className={starSize} fill="currentColor" />
            </div>
            <div className="flex gap-1">
              <Star className={starSize} fill="currentColor" />
              <Star className={starSize} fill="currentColor" />
            </div>
          </div>
        );
        return createPieceElement(iconElement, "4 Star");
      } else {
        return (
          <div className="flex items-center gap-0.5">
            <span className="text-xs font-bold">4</span>
            <Star className={starSize} fill="currentColor" />
          </div>
        );
      }
    },
    "5 Star General": () => {
      // Use one size smaller for 5 star general
      const fiveStarSize = size === "large" ? starSizes.medium : size === "medium" ? starSizes.small : "w-2.5 h-2.5";
      
      if (showLabel) {
        const iconElement = (
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex gap-1">
              <Star className={fiveStarSize} fill="currentColor" />
              <Star className={fiveStarSize} fill="currentColor" />
              <Star className={fiveStarSize} fill="currentColor" />
            </div>
            <div className="flex gap-1">
              <Star className={fiveStarSize} fill="currentColor" />
              <Star className={fiveStarSize} fill="currentColor" />
            </div>
          </div>
        );
        return createPieceElement(iconElement, "5 Star");
      } else {
        return (
          <div className="flex items-center gap-0.5">
            <span className="text-xs font-bold">5</span>
            <Star className={starSize} fill="currentColor" />
          </div>
        );
      }
    },
    "Hidden": () => createPieceElement(
      <Square className={iconSize} fill="currentColor" />,
      "Hidden"
    ),
  };

  const pieceElement = pieceElements[piece];
  if (pieceElement) {
    return pieceElement();
  }

  // Default unknown piece
  return createPieceElement(
    <Square className={iconSize} fill="currentColor" />,
    "Unknown"
  );
}
