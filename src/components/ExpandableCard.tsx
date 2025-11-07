"use client";

import React, { RefObject, useRef, useState } from "react";
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
}: ExpandableCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalExpanded, setInternalExpanded] = useState(false);

  const isControlled = isExpanded !== undefined;
  const expanded = isControlled ? isExpanded : internalExpanded;

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
    if (expanded) {
      if (isControlled) {
        onCollapse?.();
      } else {
        setInternalExpanded(false);
      }
    }
  };

  useOutsideClick(containerRef as RefObject<HTMLDivElement>, handleOutsideClick);

  return (
    <>
      <motion.div
        ref={containerRef}
        className={`relative ${className}`}
        layout={!overlay}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <motion.div
          className={`cursor-pointer ${expanded && !overlay ? expandedClassName : ""}`}
          onClick={handleToggle}
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
                initial={{ opacity: 0, height: 0, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
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
            <div className="fixed inset-0 flex items-center justify-center z-50">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                onClick={handleOutsideClick}
              />

              {/* Overlay content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`z-50 ${overlayClassName}`}
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
