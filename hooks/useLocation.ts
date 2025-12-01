import { useState, useEffect } from 'react';
import { LocationState } from '../types';

export const useLocation = () => {
  const [state, setState] = useState<LocationState>({
    coords: { latitude: null, longitude: null, accuracy: null, altitude: null },
    locationName: null,
    error: null,
  });

  const formatCoordinate = (val: number, isLat: boolean): string => {
    const direction = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W');
    const absolute = Math.abs(val);
    const degrees = Math.floor(absolute);
    const minutes = Math.floor((absolute - degrees) * 60);
    const seconds = Math.round(((absolute - degrees) * 60 - minutes) * 60);
    
    return `${degrees}°${minutes}'${seconds}" ${direction}`;
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: "Geolocation is not supported by your browser" }));
      return;
    }

    const success = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy, altitude } = position.coords;
      
      // Optional: Simple reverse geocode mock or placeholder since real reverse geocoding requires an API key
      // For a compass app, raw coordinates are often more professional looking.
      
      setState({
        coords: { latitude, longitude, accuracy, altitude },
        locationName: `${formatCoordinate(latitude, true)}  ${formatCoordinate(longitude, false)}`,
        error: null,
      });
    };

    const error = () => {
      setState(s => ({ ...s, error: "Unable to retrieve location" }));
    };

    const id = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 20000
    });

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return state;
};