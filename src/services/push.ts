/**
 * Push notification registration.
 *
 * In production this registers the device with Expo Notifications / FCM and
 * stores the token under `users/{uid}/pushTokens/{token}` so the `sendPush`
 * Cloud Function can fan out alerts (check-ins, messages, bookings, payments).
 * In demo mode the in-app notification centre covers the same events.
 */
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { getDb, isFirebaseConfigured } from '@/services/firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPush(userId: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const token = (await Notifications.getDevicePushTokenAsync()).data as string;

  if (isFirebaseConfigured) {
    const db = getDb();
    if (db) {
      await setDoc(doc(db, 'users', userId, 'pushTokens', token), {
        platform: Platform.OS,
        registeredAt: serverTimestamp(),
      });
    }
  }

  return token;
}
