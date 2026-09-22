import { AppState, DeviceEventEmitter, NativeModules } from 'react-native';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';

const native = NativeModules.DriverNotifications;
const listeners = new Set();
let status = 'Connecting order notifications…';
let refresh = () => {};
let generation = 0;
let registered = '';
let deviceToken = null;

function setStatus(message) {
  status = message;
  listeners.forEach(listener => listener(message));
}

export function subscribeNotificationStatus(listener) {
  listeners.add(listener);
  listener(status);
  return () => listeners.delete(listener);
}

async function request(token, path, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Order notifications could not connect. Retrying automatically.');
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function preferences(driverId, online) {
  const values = await AsyncStorage.multiGet(['notif_enabled', 'notif_sound', 'notif_vibration']);
  return {
    driverId, online,
    notifications: values[0][1] !== 'false',
    sound: values[1][1] !== 'false',
    vibration: values[2][1] !== 'false',
  };
}

export async function requestNotificationPermission() {
  const result = await notifee.requestPermission();
  return result.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
}

export async function notificationPermissionGranted() {
  return (await notifee.getNotificationSettings()).authorizationStatus >= AuthorizationStatus.AUTHORIZED;
}

export async function refreshOrderNotifications() {
  try {
    registered = '';
    const currentGeneration = generation;
    const data = await AsyncStorage.getItem('driver_data');
    const driver = data ? JSON.parse(data) : null;
    const online = await AsyncStorage.getItem('driver_isOnline');
    const settings = driver ? await preferences(String(driver.id), online === 'true') : null;
    if (settings && generation === currentGeneration) await native.configure(JSON.stringify(settings));
    refresh();
  } catch {
    setStatus('Could not apply alert settings. Please reopen the app.');
  }
}

export async function clearOrderNotifications() {
  generation++;
  registered = '';
  await native.configure(JSON.stringify({ driverId: '', online: false, notifications: false }));
  const token = await AsyncStorage.getItem('driver_token');
  if (token && deviceToken) {
    request(token, '/driver/push/unsubscribe', { platform: 'android', endpoint: deviceToken }).catch(() => {});
  }
  deviceToken = null;
}

export function startOrderNotifications(onOrder) {
  let stopped = false;
  let busy = false;
  let config = null;
  let configuredAt = 0;
  let configOwner = null;
  const sync = async () => {
    if (stopped || busy || AppState.currentState !== 'active') return;
    busy = true;
    const currentGeneration = generation;
    try {
      const token = await AsyncStorage.getItem('driver_token');
      const valid = async () => !stopped && currentGeneration === generation &&
        await AsyncStorage.getItem('driver_token') === token;
      if (!token) {
        await native.configure(JSON.stringify({ driverId: '', notifications: false, online: false }));
        return;
      }
      const data = await request(token, '/driver/profile');
      if (!await valid()) return;
      const driver = data.driver || data;
      const online = driver.is_online === true || driver.isOnline === true;
      await AsyncStorage.setItem('driver_isOnline', String(online));
      const settings = await preferences(String(driver.id), online);
      if (!await valid()) return;
      const diagnostics = JSON.parse(await native.configure(JSON.stringify(settings)));
      const pending = await native.consumeOrder();
      if (pending) {
        const clicked = JSON.parse(pending);
        if (clicked.driverId === String(driver.id)) {
          const detail = await request(token, `/driver/orders/${encodeURIComponent(clicked.orderId)}`);
          if (await valid() && detail.order) onOrder(detail.order);
        }
      }
      if (!settings.notifications || !diagnostics.permissionGranted) {
        if (deviceToken) {
          await request(token, '/driver/push/unsubscribe', { platform: 'android', endpoint: deviceToken });
          registered = '';
        }
        setStatus(settings.notifications ? 'Notifications blocked. Open Android notification settings to allow order alerts.' : 'Order notifications are turned off.');
        return;
      }
      if (online) {
        const inbox = await request(token, '/driver/push/inbox', { seen: JSON.parse(await native.seenEvents()) });
        if (!await valid()) return;
        if (inbox.alert) await native.showAlert(JSON.stringify(inbox.alert), false);
      }
      if (configOwner !== token || Date.now() - configuredAt > 300000) {
        config = await request(token, '/driver/push/config');
        if (!await valid()) return;
        configuredAt = Date.now();
        configOwner = token;
      }
      if (config?.firebase) {
        const signature = JSON.stringify([token, settings.sound, settings.vibration]);
        if (registered !== signature) {
          let timeout;
          let endpoint;
          try {
            endpoint = await Promise.race([
              native.getToken(JSON.stringify(config.firebase)),
              new Promise((_resolve, reject) => {
                timeout = setTimeout(() => reject(new Error('Background notification registration timed out. Retrying.')), 15000);
              }),
            ]);
          } finally {
            clearTimeout(timeout);
          }
          if (!await valid()) return;
          await request(token, '/driver/push/subscribe', {
            platform: 'android', endpoint, sound: settings.sound, vibration: settings.vibration,
            seen: JSON.parse(await native.seenEvents()),
          });
          if (!await valid()) return;
          deviceToken = endpoint;
          registered = signature;
        }
        setStatus(diagnostics.systemMuted && settings.sound
          ? 'Sound is muted in Android. Check notification volume, Do Not Disturb and the Order alerts channel.'
          : 'Order alerts are enabled. Stay online to receive new orders, including in the background.');
      } else {
        setStatus('Alerts work while the app is open. Background delivery needs Firebase configuration on the server.' +
          (diagnostics.systemMuted && settings.sound ? ' Android notification sound is also muted.' : ''));
      }
    } catch (error) {
      if (!stopped && generation === currentGeneration) {
        setStatus(error.message || 'Order notifications could not connect. Retrying automatically.');
      }
    } finally {
      busy = false;
    }
  };
  refresh = sync;
  sync();
  const interval = setInterval(sync, 15000);
  const appState = AppState.addEventListener('change', state => {
    if (state === 'active') {
      configuredAt = 0;
      registered = '';
      sync();
    }
  });
  const pressed = DeviceEventEmitter.addListener('haulkindNotificationPress', sync);
  return () => {
    stopped = true;
    clearInterval(interval);
    appState.remove();
    pressed.remove();
    refresh = () => {};
  };
}

export async function showNewOrderNotification() {
  if (!await requestNotificationPermission()) throw new Error('Enable notifications in Android Settings.');
  await refreshOrderNotifications();
  const data = JSON.parse(await AsyncStorage.getItem('driver_data') || '{}');
  const displayed = await native.showAlert(JSON.stringify({
    driverId: String(data.id),
    eventIds: [`preview:${Date.now()}`],
    title: 'Haulkind order alert',
    body: 'Order notifications use your sound and vibration settings.',
    orderId: '',
  }), true);
  if (!displayed) throw new Error('Enable order alerts and check the Order alerts channel in Android Settings.');
}

export async function openNotificationSettings() {
  const data = JSON.parse(await AsyncStorage.getItem('driver_data') || '{}');
  const diagnostics = JSON.parse(await native.configure(JSON.stringify(
    await preferences(String(data.id || ''), await AsyncStorage.getItem('driver_isOnline') === 'true')
  )));
  await notifee.openNotificationSettings(diagnostics.channelId);
}
