"use client";

import { useEffect, useRef, useState } from "react";

const DURATION_MS = 800;
const EASE_OUT = (progress: number) => 1 - Math.pow(1 - progress, 3);

export function useCountUp(target: number, duration = DURATION_MS) {
  const [value, setValue] = useState(0);
  const elementRef = useRef<HTMLSpanElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || startedRef.current) return;
        startedRef.current = true;
        observer.disconnect();

        const startTime = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - startTime) / duration, 1);
          setValue(target * EASE_OUT(progress));
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        requestAnimationFrame(animate);
      },
      { threshold: 0.2 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [target, duration]);

  return { value, elementRef };
}
