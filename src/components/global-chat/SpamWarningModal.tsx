"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Shield,
  AlertTriangle,
  MessageSquareOff,
  Siren,
  Terminal,
  AlertOctagon,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";

interface SpamWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  spamType: "repeated" | "caps" | "excessive" | "profanity" | "generic";
  message?: string;
}

export function SpamWarningModal({
  isOpen,
  onClose,
  spamType,
  message,
}: SpamWarningModalProps) {
  const getSpamConfig = () => {
    switch (spamType) {
      case "profanity":
        return {
          title: "LANGUAGE_VIOLATION",
          subtitle: "PROFANITY DETECTED",
          description:
            "Communication protocols require professional language. Offensive content has been intercepted.",
          icon: Shield,
          color: "text-red-500",
          borderColor: "border-red-500",
          bgEffect: "bg-red-500/10",
          badge: "SEVERITY: HIGH",
        };
      case "repeated":
        return {
          title: "REPETITION_DETECTED",
          subtitle: "DUPLICATE INPUT STREAM",
          description:
            "Redundant data patterns detected. Please vary your communication output.",
          icon: MessageSquareOff,
          color: "text-amber-500",
          borderColor: "border-amber-500",
          bgEffect: "bg-amber-500/10",
          badge: "SEVERITY: MEDIUM",
        };
      case "caps":
        return {
          title: "SYNTAX_WARNING",
          subtitle: "EXCESSIVE CAPITALIZATION",
          description:
            "Message volume/amplitude exceeds standard parameters. Disengage caps lock.",
          icon: AlertTriangle,
          color: "text-yellow-500",
          borderColor: "border-yellow-500",
          bgEffect: "bg-yellow-500/10",
          badge: "SEVERITY: LOW",
        };
      case "excessive":
        return {
          title: "RATE_LIMIT_EXCEEDED",
          subtitle: "MESSAGE FLOOD DETECTED",
          description:
            "Output frequency too high. Temporary cooldown initiated to preserve channel integrity.",
          icon: Siren,
          color: "text-red-500",
          borderColor: "border-red-500",
          bgEffect: "bg-red-500/10",
          badge: "SEVERITY: HIGH",
        };
      default:
        return {
          title: "SYSTEM_INTERVENTION",
          subtitle: "CONTENT FLAGGED",
          description:
            "Message intercepted by automated filter heuristic analysis.",
          icon: AlertOctagon,
          color: "text-orange-500",
          borderColor: "border-orange-500",
          bgEffect: "bg-orange-500/10",
          badge: "SYSTEM ALERT",
        };
    }
  };

  const config = getSpamConfig();
  const IconComponent = config.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full bg-zinc-900 backdrop-blur-xl border border-white/10 p-0 overflow-hidden shadow-2xl text-white rounded-sm">
        <DialogHeader className="sr-only">
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        {/* Top Security Header */}
        <div className="w-full flex items-center justify-between px-6 py-2 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3 text-white/40" />
            <span className="text-[10px] font-mono text-white/40 tracking-[0.2em]">
              AUTO_MODERATION_SYSTEM // V.2.0
            </span>
          </div>
          <Badge
            variant="outline"
            className={`text-[9px] h-4 border-white/10 bg-white/5 ${config.color} font-mono rounded-sm`}
          >
            {config.badge}
          </Badge>
        </div>

        <div className="p-6 relative">
          {/* Background Technical Elements */}
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:10px_10px]" />

          <div className="relative flex flex-col items-center text-center">
            {/* Animated Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className={`w-16 h-16 mb-4 rounded-xl border flex items-center justify-center relative ${config.borderColor} ${config.bgEffect}`}
            >
              <div
                className={`absolute inset-0 ${config.bgEffect} animate-pulse rounded-xl`}
              />
              <IconComponent className={`w-8 h-8 ${config.color}`} />
            </motion.div>

            {/* Main Title */}
            <h2
              className={`text-xl font-bold font-mono tracking-tighter mb-1 ${config.color}`}
            >
              {config.title}
            </h2>
            <p className="text-[10px] font-mono text-white/50 uppercase tracking-[0.2em] mb-4">
              {config.subtitle}
            </p>

            {/* Description */}
            <p className="text-sm text-white/70 mb-6 leading-relaxed">
              {config.description}
            </p>

            {/* Evidence Display (The Flagged Message) */}
            {message && (
              <div className="w-full mb-6 text-left">
                <div className="flex items-center gap-2 mb-1 opacity-50">
                  <Terminal className="w-3 h-3" />
                  <span className="text-[10px] font-mono uppercase tracking-wider">
                    Intercepted Payload
                  </span>
                </div>
                <div className="w-full bg-black/50 border border-white/5 rounded-sm p-3 font-mono text-xs text-white/80 break-words relative overflow-hidden group">
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-[2px] ${config.bgEffect.replace("/10", "")}`}
                  />
                  "
                  {message.length > 150
                    ? `${message.substring(0, 150)}...`
                    : message}
                  "
                </div>
              </div>
            )}

            {/* Action Button */}
            <Button
              onClick={onClose}
              className="w-full bg-white text-black hover:bg-white/90 font-mono text-xs font-bold tracking-widest h-10 rounded-sm"
            >
              <CheckCircle2 className="w-3 h-3 mr-2" />
              I_UNDERSTAND
            </Button>

            <div className="mt-3 text-[9px] text-white/30 font-mono uppercase">
              Compliance with community protocols is mandatory
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
