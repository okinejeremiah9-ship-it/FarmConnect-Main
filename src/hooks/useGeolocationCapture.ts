import { useCallback, useState } from 'react';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

interface GeolocationCaptureOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface UseGeolocationCaptureResult {
  coordinates: Coordinates | null;
  status: string | null;
  error: string | null;
  isCapturing: boolean;
  captureLocation: () => void;
  reset: () => void;
}

export const useGeolocationCapture = (
  options: GeolocationCaptureOptions = {}
): UseGeolocationCaptureResult => {
  const { enableHighAccuracy = true, timeout = 15000, maximumAge = 0 } = options;

  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const reset = useCallback(() => {
    setCoordinates(null);
    setStatus(null);
    setError(null);
  }, []);

  const captureLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported in this browser.');
      setStatus('');
      return;
    }

    setIsCapturing(true);
    setError(null);
    setStatus('Capturing your current location…');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ latitude, longitude });
        setStatus(`Location captured: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setIsCapturing(false);
      },
      (geoError) => {
        console.error('Geolocation capture failed:', geoError);
        let message = 'Unable to capture your GPS position. Please try again.';
        if (geoError.code === geoError.PERMISSION_DENIED) {
          message = 'Location permission denied. Enable access and try again.';
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          message = 'Location unavailable. Ensure you have a clear signal and try again.';
        } else if (geoError.code === geoError.TIMEOUT) {
          message = 'Capturing location timed out. Move to an open area and retry.';
        }

        setError(message);
        setStatus('');
        setIsCapturing(false);
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [enableHighAccuracy, maximumAge, timeout]);

  return {
    coordinates,
    status,
    error,
    isCapturing,
    captureLocation,
    reset,
  };
};
