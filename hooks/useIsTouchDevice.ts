import { useState, useEffect } from 'react';

export interface MobileDetection {
  isTouch: boolean;
  isIOS: boolean;
}

export const useMobileDetection = (): MobileDetection => {
  const [detection, setDetection] = useState<MobileDetection>({ isTouch: false, isIOS: false });

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    // Check for iPad, iPhone, or iPod and ensure it's not a Windows machine faking it.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    setDetection({ isTouch, isIOS });
  }, []);

  return detection;
};
