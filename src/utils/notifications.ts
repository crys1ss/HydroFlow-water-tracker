import { ReminderSettings } from '../types';
import { playReminderChime, triggerHapticFeedback } from './audio';

export type NotificationPermissionStatus = 'default' | 'granted' | 'denied' | 'unsupported';

export function getNotificationPermission(): NotificationPermissionStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionStatus;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    return result as NotificationPermissionStatus;
  } catch {
    return 'denied';
  }
}

// In-app notification event listener system for visual banners and reminders
type InAppReminderCallback = (title: string, body: string) => void;
const inAppListeners: Set<InAppReminderCallback> = new Set();

export function subscribeToInAppNotifications(cb: InAppReminderCallback): () => void {
  inAppListeners.add(cb);
  return () => {
    inAppListeners.delete(cb);
  };
}

export function broadcastInAppReminder(title: string, body: string): void {
  inAppListeners.forEach((cb) => {
    try {
      cb(title, body);
    } catch {
      // Ignore
    }
  });
}

/**
 * Check if the current time is within active reminder hours (e.g. 08:00 to 22:00)
 */
export function isWithinActiveHours(startTime: string, endTime: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = startTime.split(':').map(Number);
  const startTotalMinutes = startH * 60 + startM;

  const [endH, endM] = endTime.split(':').map(Number);
  const endTotalMinutes = endH * 60 + endM;

  if (startTotalMinutes <= endTotalMinutes) {
    return currentMinutes >= startTotalMinutes && currentMinutes <= endTotalMinutes;
  }
  // Overnight schedule case (e.g. 20:00 to 06:00)
  return currentMinutes >= startTotalMinutes || currentMinutes <= endTotalMinutes;
}

/**
 * Send a push notification (System notification + In-App notification + Audio)
 */
export async function sendWaterReminder(
  settings: ReminderSettings,
  overrideTitle?: string,
  overrideBody?: string
): Promise<boolean> {
  const title = overrideTitle || 'Hydration Reminder 💧';
  const body = overrideBody || settings.customMessage || 'Time for a fresh sip of water to stay energized!';

  // Play audio chime if enabled
  if (settings.soundEnabled) {
    playReminderChime();
    triggerHapticFeedback([80, 50, 80]);
  }

  // Always broadcast in-app banner
  broadcastInAppReminder(title, body);

  // If browser notification is permitted, display actual system push notification
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      // Try service worker notification first if available
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body,
            icon: '/icon.svg',
            badge: '/icon.svg',
            tag: 'water-reminder',
            renotify: true,
          } as NotificationOptions);
          return true;
        }
      }

      // Standard desktop/mobile browser notification fallback
      new Notification(title, {
        body,
        icon: '/icon.svg',
        tag: 'water-reminder',
      });
      return true;
    } catch {
      // Some iframe sandboxes restrict Notification creation; in-app banner handled above
      return false;
    }
  }

  return false;
}
