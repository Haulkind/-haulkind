'use client'

import { getVapidKey, subscribePush } from './api';
import { getToken } from './auth';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    console.log('[PWA] Service worker registered');
    return reg;
  } catch (e) {
    console.error('[PWA] Service worker registration failed:', e);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export async function subscribeToPush(jobId?: string): Promise<boolean> {
  try {
    const reg = await registerServiceWorker();
    if (!reg) return false;

    const granted = await requestNotificationPermission();
    if (!granted) return false;

    const { publicKey } = await getVapidKey();
    if (!publicKey) {
      console.warn('[PWA] No VAPID key available');
      return false;
    }

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const token = getToken();
    await subscribePush(subscription, jobId, token || undefined);
    console.log('[PWA] Push subscription saved');
    return true;
  } catch (e) {
    console.error('[PWA] Push subscription failed:', e);
    return false;
  }
}
