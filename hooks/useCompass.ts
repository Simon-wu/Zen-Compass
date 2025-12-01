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
    let heading: number | null = null;
    let accuracy = 0;

    // iOS Webkit
    if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
      heading = event.webkitCompassHeading;
      accuracy = event.webkitCompassAccuracy || 0;
    } 
    // Android: Try absolute data first
    else if (event.absolute === true || event.type === 'deviceorientationabsolute') {
      if (event.alpha !== null) {
         // Android standard: alpha is counter-clockwise rotation from North
         heading = 360 - event.alpha;
      }
    }
    // Android Fallback: regular deviceorientation (might be relative, but better than nothing if absolute fails)
    else if (event.alpha !== null && heading === null) {
       // If event.absolute is undefined or false, this might drift, but some devices only send this.
       heading = 360 - event.alpha;
    }

    if (heading === null) return;

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
      accuracy,
      roll,
      pitch,
    });
  }, []);

  const requestPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setPermissionGranted(true);
          // iOS 13+
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          setError('Permission denied');
        }
      } catch (err: any) {
        setError(err.message || 'Error requesting permission');
      }
    } else {
      // Android / Non-iOS 13+
      setPermissionGranted(true);
      // We bind listeners in useEffect for these cases
    }
  };

  useEffect(() => {
    // Check if we need to ask for permission (iOS 13+)
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      setNeedsPermission(true);
    } else {
      setNeedsPermission(false);
      setPermissionGranted(true);
      
      // Android / Standard PC implementation
      // Chrome on Android prefers 'deviceorientationabsolute' for compass
      if ('ondeviceorientationabsolute' in window) {
        window.addEventListener('deviceorientationabsolute', handleOrientation as any, true);
      } 
      
      // Always listen to standard event as well for fallback and tilt data
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      if ('ondeviceorientationabsolute' in window) {
        window.removeEventListener('deviceorientationabsolute', handleOrientation as any);
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