import { useState, useEffect } from 'react';

export const useIsTouchDevice = (): boolean => {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const check = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouch(check);
  }, []);
  return isTouch;
};
