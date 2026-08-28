import { getMessaging, getToken, getInitialNotification, onMessage, onNotificationOpenedApp, requestPermission } from '@react-native-firebase/messaging';
import type { RemoteMessage } from '@react-native-firebase/messaging';
import { FCMHandler, FcmClient } from './fcm-handler';

const client: FcmClient = {
  onMessage: (listener) => onMessage(getMessaging(), (message) => listener(normalizeMessage(message))),
  onNotificationOpenedApp: (listener) => onNotificationOpenedApp(getMessaging(), (message) => listener(normalizeMessage(message))),
  getInitialNotification: async () => { const message = await getInitialNotification(getMessaging()); return message ? normalizeMessage(message) : null; },
};

function normalizeMessage(message: RemoteMessage): { data?: Record<string, string> } {
  const data = Object.fromEntries(Object.entries(message.data ?? {}).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
  return { data };
}

export function createFirebaseNotificationHandler(navigate: (route: { screen: string; classId: string; assignmentId: string }) => void): FCMHandler {
  return new FCMHandler(client, navigate);
}

export async function registerDeviceToken(): Promise<string> {
  const instance = getMessaging();
  await requestPermission(instance);
  return getToken(instance);
}
