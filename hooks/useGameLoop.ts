import { useEffect, useRef } from 'react';

export const useGameLoop = (callback: (deltaTime: number) => void, paused: boolean = false) => {
  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(performance.now());
  const callbackRef = useRef(callback);

  // Update callback ref to avoid stale closures
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const animate = (time: number) => {
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;
      callbackRef.current(deltaTime);
      requestRef.current = requestAnimationFrame(animate);
    };

    if (!paused) {
      lastTimeRef.current = performance.now(); // Reset timer when unpausing
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