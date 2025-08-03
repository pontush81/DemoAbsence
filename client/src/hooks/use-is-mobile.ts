import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      // Kontrollera både viewport storlek och touch-kapacitet
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallViewport = window.innerWidth < 768; // md breakpoint
      const userAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      setIsMobile(hasTouch && (isSmallViewport || userAgent));
    };

    // Kontrollera vid första laddning
    checkIsMobile();

    // Lyssna på viewport-ändringar
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return isMobile;
}