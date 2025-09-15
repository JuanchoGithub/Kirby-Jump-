import { useEffect, useRef } from 'react';

export const useGameLoop = (callback: () => void, paused: boolean = false) => {
  // FIX: Explicitly initialize useRef with undefined to satisfy toolchains that expect an argument.
  const requestRef = useRef<number | undefined>(undefined);
  const callbackRef = useRef(callback);

  // Update callback ref to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const animate = (_time: number) => {
      callbackRef.current();
      requestRef.current = requestAnimationFrame(animate);
    };

    if (!paused) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = undefined;
      }
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [paused]);
};
