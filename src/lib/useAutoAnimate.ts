"use client";

import { useEffect, useRef, RefObject } from "react";
import autoAnimate from "@formkit/auto-animate";

interface AutoAnimateOptions {
  duration?: number;
  easing?: string;
  disrespectUserMotionPreference?: boolean;
}

export function useAutoAnimate<T extends HTMLElement = HTMLDivElement>(
  options?: AutoAnimateOptions,
): RefObject<T> {
  const ref = useRef<T>(null!);

  useEffect(() => {
    if (ref.current) {
      const controller = autoAnimate(ref.current, options);
      return () => controller.destroy?.();
    }
  }, [options]);

  return ref;
}

// Hook for enabling/disabling animations dynamically
export function useAutoAnimateController<
  T extends HTMLElement = HTMLDivElement,
>(
  options?: AutoAnimateOptions,
): [
  RefObject<T | null>,
  { enable: () => void; disable: () => void; isEnabled: () => boolean },
] {
  const ref = useRef<T>(null);
  const controllerRef = useRef<any>(null);

  useEffect(() => {
    if (ref.current) {
      controllerRef.current = autoAnimate(ref.current, options);
    }
  }, [options]);

  const enable = () => controllerRef.current?.enable?.();
  const disable = () => controllerRef.current?.disable?.();
  const isEnabled = () => controllerRef.current?.isEnabled?.() ?? false;

  return [ref, { enable, disable, isEnabled }];
}
