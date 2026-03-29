/**
 * @format
 */
import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import App from './new_App';
import { name as appName } from './app.json';

// Register background event handler for notifications
// This ensures notifications with sound/vibration work when app is backgrounded or screen is locked
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification, pressAction } = detail;
  if (type === EventType.PRESS || (type === EventType.ACTION_PRESS && pressAction?.id === 'default')) {
    // User pressed the notification — app will open automatically
    console.log('[NOTIF-BG] Notification pressed:', notification?.title);
  }
});

AppRegistry.registerComponent(appName, () => App);
