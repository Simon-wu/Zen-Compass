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
  // Track if we are receiving high-quality absolute data to ignore low-quality fallbacks
  const hasAbsoluteData = useRef<boolean>(false);

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
    let isAbsolute = false;

    // 1. iOS Webkit (Best for iOS)
    if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
      heading = event.webkitCompassHeading;
      accuracy = event.webkitCompassAccuracy || 0;
      isAbsolute = true;
    } 
    // 2. Android: Absolute Event (Best for Android)
    else if (event.type === 'deviceorientationabsolute' || event.absolute === true) {
      if (event.alpha !== null) {
         heading = 360 - event.alpha;
         isAbsolute = true;
         hasAbsoluteData.current = true; // Mark that we have a good source
      }
    }
    // 3. Android: Standard Event (Fallback)
    else if (event.type === 'deviceorientation') {
        // If we have already received absolute data from the other event listener,
        // IGNORE the alpha from this relative event to prevent jitter/conflict.
        if (hasAbsoluteData.current) {
            heading = null; // Skip heading update from this event
        } else if (event.alpha !== null) {
            // Only use this if we have NO other choice
            heading = 360 - event.alpha;
        }
    }

    // Always update tilt (Pitch/Roll) from any valid event
    // (Sometimes absolute events don't carry beta/gamma on some devices, so we take them from wherever we can)
    const roll = event.gamma || 0;  // Left/Right
    const pitch = event.beta || 0;  // Front/Back
    
    // If we have a heading update, process it
    if (heading !== null) {
        // Normalize
        heading = heading % 360;
        if (heading < 0) heading += 360;

        // Apply smoothing
        const smoothed = smoothHeading(lastHeading.current, heading);
        lastHeading.current = smoothed;

        setCompassData({
            heading: smoothed,
            accuracy,
            roll,
            pitch,
        });
    } else {
        // If we only have tilt data (because we ignored relative heading), update just tilt
        // We use the last known heading to keep UI stable
        setCompassData(prev => ({
            ...prev,
            roll,
            pitch,
        }));
    }

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
      
      // Always listen to standard event as well for tilt (beta/gamma) data
      // Our handleOrientation logic now safely ignores the alpha if it conflicts.
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