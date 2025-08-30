"use client";

import { forwardRef, useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface MentionInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onMentionTrigger?: (query: string, position: { top: number; left: number }) => void;
  onMentionClose?: () => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export const MentionInput = forwardRef<HTMLInputElement, MentionInputProps>(
  ({
    value,
    onChange,
    onMentionTrigger,
    onMentionClose,
    placeholder,
    maxLength,
    className,
    ...props
  }, ref) => {
    const [cursorPosition, setCursorPosition] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Use the forwarded ref or our internal ref
    const actualInputRef = ref || inputRef;

    // Track mention state
    const [mentionQuery, setMentionQuery] = useState<string>("");
    const [mentionPosition, setMentionPosition] = useState<{ top: number; left: number } | null>(null);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      const newCursorPosition = e.target.selectionStart || 0;

      setCursorPosition(newCursorPosition);
      onChange(newValue);

      // Check for mention trigger (allow dashes in usernames)
      const textBeforeCursor = newValue.slice(0, newCursorPosition);
      const mentionMatch = textBeforeCursor.match(/(@([\w-]*)$)/);

      if (mentionMatch) {
        const query = mentionMatch[2]; // Use second capture group for username without @

        // Calculate position for autocomplete dropdown
        if (actualInputRef && 'current' in actualInputRef && actualInputRef.current) {
          const input = actualInputRef.current;

          // Get input element position relative to viewport
          const inputRect = input.getBoundingClientRect();

          // Position dropdown below the input
          const cursorY = inputRect.bottom + 4; // Small offset below input
          const cursorX = inputRect.left; // Align with input start

          const position = {
            top: cursorY,
            left: Math.max(cursorX, 10), // Ensure it doesn't go off-screen left, minimum 10px from edge
          };

          setMentionQuery(query);
          setMentionPosition(position);
          onMentionTrigger?.(query, position);
        }
      } else {
        setMentionQuery("");
        setMentionPosition(null);
        onMentionClose?.();
      }
    }, [onChange, onMentionTrigger, onMentionClose, actualInputRef]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      // Handle mention selection with Tab
      if (e.key === "Tab" && mentionQuery !== "") {
        e.preventDefault();
        // Tab completion - could be enhanced to select first match
        return;
      }

      // Close mention on Escape
      if (e.key === "Escape" && mentionPosition) {
        setMentionQuery("");
        setMentionPosition(null);
        onMentionClose?.();
        return;
      }

      // Update cursor position on arrow keys
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        setTimeout(() => {
          if (actualInputRef && 'current' in actualInputRef && actualInputRef.current) {
            setCursorPosition(actualInputRef.current.selectionStart || 0);
          }
        }, 0);
      }
    }, [mentionQuery, mentionPosition, onMentionClose, actualInputRef]);

    const handleMentionSelect = useCallback((username: string) => {
      if (!mentionPosition) return;

      // Find the @mention start position
      const textBeforeCursor = value.slice(0, cursorPosition);
      const mentionStart = textBeforeCursor.lastIndexOf("@");

      if (mentionStart !== -1) {
        // Replace the mention with the selected username
        const beforeMention = value.slice(0, mentionStart);
        const afterMention = value.slice(cursorPosition);
        const newValue = beforeMention + "@" + username + " " + afterMention;

        onChange(newValue);

        // Update cursor position
        const newCursorPosition = mentionStart + username.length + 2; // +2 for @ and space
        setTimeout(() => {
          if (actualInputRef && 'current' in actualInputRef && actualInputRef.current) {
            actualInputRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
            actualInputRef.current.focus();
          }
        }, 0);

        // Clear mention state
        setMentionQuery("");
        setMentionPosition(null);
        onMentionClose?.();
      }
    }, [value, cursorPosition, mentionPosition, onChange, onMentionClose, actualInputRef]);

    // Clear mention state on blur
    const handleBlur = useCallback(() => {
      setTimeout(() => {
        setMentionQuery("");
        setMentionPosition(null);
        onMentionClose?.();
      }, 150); // Small delay to allow clicks on autocomplete
    }, [onMentionClose]);

    // Expose mention select function to parent
    useEffect(() => {
      if (actualInputRef && 'current' in actualInputRef && actualInputRef.current) {
        (actualInputRef.current as any)._mentionSelect = handleMentionSelect;
      }
    }, [handleMentionSelect, actualInputRef]);

    return (
      <div ref={containerRef} className="relative">
        <input
          {...props}
          ref={actualInputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            "w-full bg-black/60 border border-white/30 text-white placeholder:text-white/50",
            "focus:border-blue-400/70 focus:ring-2 focus:ring-blue-400/30",
            "rounded-full px-4 py-2 text-sm",
            "transition-all duration-200",
            className
          )}
        />
      </div>
    );
  }
);



MentionInput.displayName = "MentionInput";
