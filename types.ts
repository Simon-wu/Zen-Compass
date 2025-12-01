export interface Coordinates {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
}

export interface CompassData {
  heading: number; // 0-360 degrees
  accuracy: number;
  roll: number; // Left/Right tilt
  pitch: number; // Front/Back tilt
}

export interface LocationState {
  coords: Coordinates;
  locationName: string | null;
  error: string | null;
}

// Extend Window interface for iOS specific properties
declare global {
  interface Window {
    DeviceOrientationEvent: any;
  }
}