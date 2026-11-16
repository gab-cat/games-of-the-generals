"use client";

import React, { RefObject, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOutsideClick } from "../lib/use-outside-click";

interface ExpandableCardProps {
  children: React.ReactNode;
  expandedContent?: React.ReactNode;
  isExpanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  className?: string;
  expandedClassName?: string;
  overlay?: boolean;
  overlayClassName?: string;
  /** Names the overlay for screen readers. */
  overlayLabel?: string;
}

export function ExpandableCard({
  children,
  expandedContent,
  isExpanded = false,
  onExpand,
  onCollapse,
  className = "",
  expandedClassName = "",
  overlay = false,
  overlayClassName = "",
  overlayLabel,
}: ExpandableCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalExpanded, setInternalExpanded] = useState(false);

  const isControlled = isExpanded !== undefined;
  const expanded = isControlled ? isExpanded : internalExpanded;

  const collapse = () => {
    if (isControlled) {
      onCollapse?.();
    } else {
      setInternalExpanded(false);
    }
  };

  const handleToggle = () => {
    if (isControlled) {
      if (expanded) {
        onCollapse?.();
      } else {
        onExpand?.();
      }
    } else {
      setInternalExpanded(!expanded);
    }
  };

  const handleOutsideClick = () => {
    if (expanded) collapse();
  };

  // In overlay mode the content lives outside the card, so a click inside it
  // must not count as "outside". The backdrop and Escape close it instead.
  useOutsideClick(
    containerRef as RefObject<HTMLDivElement>,
    overlay ? () => {} : handleOutsideClick,
  );

  useEffect(() => {
    if (!overlay || !expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCollapse?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [overlay, expanded, onCollapse]);

  return (
    <>
      <motion.div
        ref={containerRef}
        className={`relative ${className}`}
        layout={!overlay}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <motion.div
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          className={`cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/70 ${expanded && !overlay ? expandedClassName : ""}`}
          onClick={handleToggle}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleToggle();
            }
          }}
          layout={!overlay}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {children}
        </motion.div>

        {/* Inline expanded content (when overlay is false) */}
        {!overlay && (
          <AnimatePresence>
            {expanded && expandedContent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                {expandedContent}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Overlay expanded content (when overlay is true) */}
      {overlay && (
        <AnimatePresence>
          {expanded && expandedContent && (
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 sm:items-center sm:p-6">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black/70"
                onClick={handleOutsideClick}
              />

              {/* Overlay content */}
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label={overlayLabel}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`relative my-auto w-full ${overlayClassName}`}
              >
                {expandedContent}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
