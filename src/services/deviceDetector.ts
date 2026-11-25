import { useState, useEffect } from 'react';
import type { DeviceMode } from '../types';

export type DetectedDeviceType = 'phone' | 'ipad' | 'pc';

/**
 * Detects whether the current device is a Phone, iPad/Tablet, or PC
 * using both User-Agent sniffing and viewport/screen measurements.
 */
export function detectRealDevice(): DetectedDeviceType {
  if (typeof window === 'undefined') return 'pc';

  const ua = (navigator.userAgent || navigator.vendor || (window as any).opera || '').toLowerCase();
  const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 1024;
  const isTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;

  // 1. Mobile Phone detection via User Agent
  const isPhoneUA = /iphone|ipod|android.*mobile|windows phone|blackberry|bb10|mobile/i.test(ua);
  if (isPhoneUA) {
    return 'phone';
  }

  // 2. Tablet / iPad detection (including iPads on iOS 13+ that report MacIntel with touch)
  const isIPad = /ipad/i.test(ua) || (ua.includes('macintosh') && isTouch && width <= 1366);
  const isTabletUA = /tablet|android(?!.*mobile)/i.test(ua);
  if (isIPad || isTabletUA) {
    return 'ipad';
  }

  // 3. Viewport width fallback
  if (width <= 640) {
    return 'phone';
  }
  if (width <= 1024) {
    return isTouch ? 'ipad' : (width <= 768 ? 'phone' : 'ipad');
  }

  return 'pc';
}

/**
 * Custom hook to continuously track the current device and window resize
 */
export function useDeviceDetector() {
  const [detected, setDetected] = useState<DetectedDeviceType>(detectRealDevice);

  useEffect(() => {
    const handleUpdate = () => {
      const next = detectRealDevice();
      setDetected((prev) => (prev !== next ? next : prev));
    };

    window.addEventListener('resize', handleUpdate, { passive: true });
    window.addEventListener('orientationchange', handleUpdate, { passive: true });

    // Initial check
    handleUpdate();

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('orientationchange', handleUpdate);
    };
  }, []);

  return detected;
}
