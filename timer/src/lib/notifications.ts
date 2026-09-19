/**
 * Best-effort local notifications.
 *
 * This is a static front-end app with no push server, so these reminders
 * only fire while the app is open in a browser tab (a `setTimeout` for the
 * scheduled practice time, and an immediate check on load for the
 * "haven't opened in a while" case). True background notifications while
 * the browser is fully closed would require a backend push service, which
 * is out of scope here.
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  if (Notification.permission === 'default') {
    return Notification.requestPermission();
  }
  return Notification.permission;
}

export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // registration failures shouldn't break the app
    });
  }
}

export async function showLocalNotification(title: string, options?: NotificationOptions): Promise<void> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, options);
      return;
    } catch {
      // fall through to the direct constructor
    }
  }

  try {
    new Notification(title, options);
  } catch {
    // e.g. Android Chrome without an active service worker - nothing more we can do
  }
}

/** ms until the next occurrence of local "HH:MM" (today if still ahead, otherwise tomorrow). */
export function msUntilNextTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  const now = new Date();
  const target = new Date(now);
  target.setHours(h || 0, m || 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}

export const RETURN_REMINDER_THRESHOLD_MS = 2 * 24 * 60 * 60 * 1000;
