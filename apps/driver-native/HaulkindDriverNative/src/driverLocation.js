import { AppState, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export const LOCATION_MAX_AGE = 30000;

export function startDriverLocationTracking(onPosition, onStatus) {
  let disposed = false;
  let generation = 0;
  let watchId = null;
  let timer = null;
  let latestTimestamp = 0;

  function stop() {
    generation++;
    if (watchId !== null) Geolocation.clearWatch(watchId);
    if (timer !== null) clearInterval(timer);
    watchId = null;
    timer = null;
  }

  async function start() {
    stop();
    const currentGeneration = generation;
    const isCurrent = () => !disposed && generation === currentGeneration;
    onStatus('locating');
    let precise = true;

    try {
      if (Platform.OS === 'android') {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        if (!isCurrent()) return;
        precise = grants[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
        const approximate = grants[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
        if (!precise && !approximate) {
          onStatus('denied');
          return;
        }
        Geolocation.setRNConfiguration({
          skipPermissionRequests: true,
          locationProvider: 'playServices',
        });
      }
      if (!isCurrent()) return;

      const receive = (position) => {
        if (!isCurrent()) return;
        const { latitude, longitude, accuracy, heading, speed } = position.coords;
        const timestamp = position.timestamp;
        if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
            !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
            !Number.isFinite(timestamp) || timestamp <= latestTimestamp) return;
        if (Date.now() - timestamp > LOCATION_MAX_AGE) {
          if (Date.now() - latestTimestamp > LOCATION_MAX_AGE) onStatus('stale');
          return;
        }
        latestTimestamp = timestamp;
        onPosition({ latitude, longitude, accuracy, heading, speed, timestamp });
        onStatus(precise && accuracy <= 50 ? 'live' : 'approximate');
      };
      const fail = (error) => {
        if (!isCurrent()) return;
        if (error.code === 1) {
          stop();
          onStatus('denied');
        } else if (Date.now() - latestTimestamp > LOCATION_MAX_AGE) {
          onStatus('unavailable');
        }
      };
      const options = { enableHighAccuracy: precise, timeout: 15000, maximumAge: 5000 };
      Geolocation.getCurrentPosition(receive, fail, options);
      watchId = Geolocation.watchPosition(receive, fail, {
        ...options, distanceFilter: 0, interval: 5000, fastestInterval: 2000,
      });
      timer = setInterval(() => {
        if (!isCurrent()) return;
        if (Date.now() - latestTimestamp > LOCATION_MAX_AGE) onStatus('stale');
        Geolocation.getCurrentPosition(receive, fail, options);
      }, 15000);
    } catch {
      if (isCurrent()) onStatus('unavailable');
    }
  }

  let appState = AppState.currentState;
  if (appState === 'active' || appState === null) start();
  const subscription = AppState.addEventListener('change', (nextState) => {
    if (nextState === appState) return;
    appState = nextState;
    if (nextState === 'active') start();
    else stop();
  });

  return () => {
    disposed = true;
    stop();
    subscription.remove();
  };
}
