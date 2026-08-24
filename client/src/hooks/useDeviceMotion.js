import { useEffect, useRef, useCallback } from 'react';

// Impact detection threshold: ~45 m/s² (phone drops ~30, car crashes 50-150+)
const IMPACT_THRESHOLD = 45;
// Sustained impact duration in ms
const IMPACT_DURATION = 200;
// Cooldown after detection to prevent re-triggering
const COOLDOWN_MS = 10000;

export function useDeviceMotion(onImpact) {
  const lastImpactTime = useRef(0);
  const impactStart = useRef(null);
  const permissionGranted = useRef(false);

  const handleMotion = useCallback((event) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;

    const now = Date.now();
    if (now - lastImpactTime.current < COOLDOWN_MS) return;

    // Calculate total acceleration magnitude
    const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);

    // Subtract gravity (approx 9.8) to get net acceleration
    const netAccel = Math.abs(magnitude - 9.81);

    if (netAccel >= IMPACT_THRESHOLD) {
      if (!impactStart.current) {
        impactStart.current = now;
      } else if (now - impactStart.current >= IMPACT_DURATION) {
        lastImpactTime.current = now;
        impactStart.current = null;
        onImpact(netAccel);
      }
    } else {
      impactStart.current = null;
    }
  }, [onImpact]);

  useEffect(() => {
    // Request permission on iOS 13+
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then(state => {
          if (state === 'granted') {
            permissionGranted.current = true;
            window.addEventListener('devicemotion', handleMotion);
          }
        })
        .catch(() => {});
    } else if (typeof DeviceMotionEvent !== 'undefined') {
      permissionGranted.current = true;
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [handleMotion]);

  // Function to manually request permission (call on first user interaction)
  const requestPermission = useCallback(async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const state = await DeviceMotionEvent.requestPermission();
        if (state === 'granted') {
          permissionGranted.current = true;
          window.addEventListener('devicemotion', handleMotion);
        }
      } catch(e) {}
    }
  }, [handleMotion]);

  return { requestPermission };
}
