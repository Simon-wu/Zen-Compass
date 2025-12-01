import { useState, useEffect, useCallback, useRef } from 'react';
import { CompassData } from '../types';

export const useCompass = () => {
  const [compassData, setCompassData] = useState<CompassData>({
    heading: 0,
    accuracy: 0,
    roll: 0,
    pitch: 0,
  });
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [needsPermission, setNeedsPermission] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs for smoothing to avoid dependency loops in event listeners
  const lastHeading = useRef<number>(0);

  // Smooth the heading transition
  const smoothHeading = (current: number, target: number): number => {
    let delta = target - current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    
    // Adaptive smoothing: faster when delta is large, smoother when small
    const factor = Math.abs(delta) > 30 ? 0.3 : 0.15;
    
    return current + delta * factor;
  };

  const handleOrientation = useCallback((event: DeviceOrientationEvent | any) => {
    let heading = 0;

    // iOS Webkit
    if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
      heading = event.webkitCompassHeading;
    } 
    // Android / Non-Webkit
    else if (event.alpha !== null) {
      // In some Android browsers, alpha is just relative to start. 
      // 'absolute' property check handles newer implementations.
      // We convert standard alpha (counter-clockwise) to compass heading (clockwise)
      heading = 360 - event.alpha;
    }

    // Normalize
    heading = heading % 360;
    if (heading < 0) heading += 360;

    // Apply smoothing
    const smoothed = smoothHeading(lastHeading.current, heading);
    lastHeading.current = smoothed;

    // Get tilt for the "level" bubble
    const roll = event.gamma || 0;  // Left/Right
    const pitch = event.beta || 0;  // Front/Back

    setCompassData({
      heading: smoothed,
      accuracy: event.webkitCompassAccuracy || 0,
      roll,
      pitch,
    });
  }, []);

  const requestPermission = async () => {
    if (typeof DeviceOrientationEvent === 'undefined') {
        setError('Device orientation not supported on this device.');
        return;
    }

    if (
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setPermissionGranted(true);
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          setError('Permission denied');
        }
      } catch (err: any) {
        setError(err.message || 'Error requesting permission');
      }
    } else {
      // Non-iOS 13+ devices
      setPermissionGranted(true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
  };

  useEffect(() => {
    // Check if we need to ask for permission (iOS 13+)
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      setNeedsPermission(true);
    } else {
      setNeedsPermission(false);
      // For non-iOS 13+, we usually don't need explicit permission click, 
      // but some browsers still block it without user interaction in strict modes.
      // We will set granted true here for simplicity, but if it fails, the user might need to click start.
      setPermissionGranted(true);
      if (typeof window !== 'undefined') {
          window.addEventListener('deviceorientation', handleOrientation, true);
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
          window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, [handleOrientation]);

  return {
    compassData,
    permissionGranted,
    needsPermission,
    requestPermission,
    error,
  };
};