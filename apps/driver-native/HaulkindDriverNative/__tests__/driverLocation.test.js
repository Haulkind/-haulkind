import { AppState, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { startDriverLocationTracking } from '../src/driverLocation';

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
  AppState: { currentState: 'active', addEventListener: jest.fn() },
  PermissionsAndroid: {
    PERMISSIONS: { ACCESS_FINE_LOCATION: 'fine', ACCESS_COARSE_LOCATION: 'coarse' },
    RESULTS: { GRANTED: 'granted' },
    requestMultiple: jest.fn(),
  },
}));
jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}));

const position = (timestamp = Date.now(), latitude = 0) => ({
  timestamp,
  coords: { latitude, longitude: 0, accuracy: 8, heading: 90, speed: 4 },
});
const flush = () => Promise.resolve();
let stop;
let onPosition;
let onStatus;
let removeListener;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  onPosition = jest.fn();
  onStatus = jest.fn();
  removeListener = jest.fn();
  AppState.addEventListener.mockReturnValue({ remove: removeListener });
  PermissionsAndroid.requestMultiple.mockResolvedValue({ fine: 'granted', coarse: 'granted' });
  Geolocation.watchPosition.mockReturnValue(0);
});
afterEach(() => {
  stop?.();
  jest.useRealTimers();
});

test('requests fine and coarse together; follows small movements and retains heading/speed', async () => {
  stop = startDriverLocationTracking(onPosition, onStatus);
  await flush();
  expect(PermissionsAndroid.requestMultiple).toHaveBeenCalledWith(['fine', 'coarse']);
  const [receive, , options] = Geolocation.watchPosition.mock.calls[0];
  expect(options).toMatchObject({ distanceFilter: 0, interval: 5000, enableHighAccuracy: true });
  receive(position());
  receive(position(Date.now() + 5000, 0.00001));
  expect(onPosition).toHaveBeenCalledTimes(2);
  expect(onPosition).toHaveBeenLastCalledWith(expect.objectContaining({ latitude: 0.00001, heading: 90, speed: 4 }));
  expect(onStatus).toHaveBeenLastCalledWith('live');
});

test('denial never generates or uploads a fallback position', async () => {
  PermissionsAndroid.requestMultiple.mockResolvedValue({ fine: 'denied', coarse: 'denied' });
  stop = startDriverLocationTracking(onPosition, onStatus);
  await flush();
  expect(Geolocation.watchPosition).not.toHaveBeenCalled();
  expect(onPosition).not.toHaveBeenCalled();
  expect(onStatus).toHaveBeenLastCalledWith('denied');
});

test('approximate permission still works and is labelled accurately', async () => {
  PermissionsAndroid.requestMultiple.mockResolvedValue({ fine: 'denied', coarse: 'granted' });
  stop = startDriverLocationTracking(onPosition, onStatus);
  await flush();
  const [receive, , options] = Geolocation.watchPosition.mock.calls[0];
  receive(position());
  expect(options.enableHighAccuracy).toBe(false);
  expect(onStatus).toHaveBeenLastCalledWith('approximate');
});

test('old, invalid and out-of-order fixes are not uploaded', async () => {
  stop = startDriverLocationTracking(onPosition, onStatus);
  await flush();
  const receive = Geolocation.watchPosition.mock.calls[0][0];
  receive(position(Date.now() - 40000));
  receive(position(Date.now(), NaN));
  receive(position(Date.now(), 91));
  expect(onPosition).not.toHaveBeenCalled();
  receive(position());
  Geolocation.getCurrentPosition.mock.calls[0][0](position(Date.now() - 1000, 1));
  expect(onPosition).toHaveBeenCalledTimes(1);
});

test('15 second heartbeat requests a fresh fix instead of resending stale coordinates', async () => {
  stop = startDriverLocationTracking(onPosition, onStatus);
  await flush();
  Geolocation.watchPosition.mock.calls[0][0](position());
  jest.advanceTimersByTime(45000);
  expect(Geolocation.getCurrentPosition).toHaveBeenCalledTimes(4);
  expect(onPosition).toHaveBeenCalledTimes(1);
  expect(onStatus).toHaveBeenLastCalledWith('stale');
});

test('GPS failure retains the last position and recovers when a new fix arrives', async () => {
  stop = startDriverLocationTracking(onPosition, onStatus);
  await flush();
  const [receive, fail] = Geolocation.watchPosition.mock.calls[0];
  receive(position());
  jest.advanceTimersByTime(35000);
  fail({ code: 2 });
  expect(onStatus).toHaveBeenLastCalledWith('unavailable');
  expect(onPosition).toHaveBeenCalledTimes(1);
  receive(position());
  expect(onStatus).toHaveBeenLastCalledWith('live');
});

test('cleans watch id zero, timers and listener, ignoring callbacks after unmount', async () => {
  stop = startDriverLocationTracking(onPosition, onStatus);
  await flush();
  const receive = Geolocation.watchPosition.mock.calls[0][0];
  stop();
  receive(position());
  jest.advanceTimersByTime(45000);
  expect(onPosition).not.toHaveBeenCalled();
  expect(Geolocation.clearWatch).toHaveBeenCalledWith(0);
  expect(Geolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
  expect(removeListener).toHaveBeenCalled();
});

test('does not create a watch after unmount while a permission request is pending', async () => {
  stop = startDriverLocationTracking(onPosition, onStatus);
  stop();
  await flush();
  expect(Geolocation.watchPosition).not.toHaveBeenCalled();
});

test('returning from settings restarts one watch and ignores old callbacks', async () => {
  stop = startDriverLocationTracking(onPosition, onStatus);
  await flush();
  const receive = Geolocation.watchPosition.mock.calls[0][0];
  const changeState = AppState.addEventListener.mock.calls[0][1];
  changeState('background');
  receive(position());
  expect(onPosition).not.toHaveBeenCalled();
  changeState('active');
  changeState('active');
  await flush();
  expect(Geolocation.watchPosition).toHaveBeenCalledTimes(2);
  Geolocation.watchPosition.mock.calls[1][0](position());
  expect(onPosition).toHaveBeenCalledTimes(1);
});
