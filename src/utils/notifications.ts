import { Task, ReminderTiming } from '../types';
import { soundFx } from './sound';
import { formatKhmerTime } from './khmerDates';

let swRegistration: ServiceWorkerRegistration | null = null;

// Register Service Worker for background and lockscreen notifications
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    return reg;
  } catch (err) {
    console.warn('Service Worker registration failed or unsupported in iframe:', err);
    return null;
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermissionStatus(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    // Ensure service worker is registered
    registerServiceWorker().catch(() => {});
    return 'granted';
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      registerServiceWorker().catch(() => {});
    }
    return permission;
  } catch {
    return 'denied';
  }
}

export interface NotificationOptionsExtra {
  tag?: string;
  data?: any;
  vibrate?: number[];
  renotify?: boolean;
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string }>;
}

export async function sendBrowserNotification(
  title: string,
  body: string,
  icon?: string,
  extraOptions?: NotificationOptionsExtra
) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  const defaultIcon =
    icon ||
    'https://media.licdn.com/dms/image/v2/C560BAQF9ZB9CkX4iUA/company-logo_200_200/company-logo_200_200/0/1630643946400/sokha_printing_logo?e=2147483647&v=beta&t=pw-C2fZF3thYSrSFbhK49soL50jSUHpnBkpwzshWplw';

  // Trigger mobile vibration if available
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(extraOptions?.vibrate || [250, 100, 250, 100, 250]);
    } catch {
      // Ignore vibration errors
    }
  }

  // 1. Try Service Worker showNotification (Best for Phone Lockscreen & Background)
  try {
    if ('serviceWorker' in navigator) {
      const reg = swRegistration || (await navigator.serviceWorker.getRegistration());
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, {
          body,
          icon: defaultIcon,
          badge: defaultIcon,
          vibrate: [250, 100, 250, 100, 250],
          requireInteraction: true,
          tag: extraOptions?.tag || 'taskmate-notify-' + Date.now(),
          renotify: true,
          data: extraOptions?.data || { url: window.location.href },
          ...extraOptions,
        } as any);
        return;
      }
    }
  } catch (err) {
    console.warn('SW notification fallback to standard notification:', err);
  }

  // 2. Standard Notification constructor Fallback
  try {
    new Notification(title, {
      body,
      icon: defaultIcon,
      tag: extraOptions?.tag || 'taskmate-' + Date.now(),
      requireInteraction: true,
    } as any);
  } catch {
    // Ignore iframe notification errors
  }
}

// Calculate the reminder timestamp for a task in milliseconds
export function getReminderTargetTimestamp(task: Task): number | null {
  if (task.completed || task.reminderTiming === 'none') {
    return null;
  }

  // If snoozed, check snoozed time
  if (task.reminderSnoozedUntil) {
    return new Date(task.reminderSnoozedUntil).getTime();
  }

  if (!task.dueDate) return null;

  const [y, m, d] = task.dueDate.split('-').map(Number);
  const [hour, min] = (task.dueTime || '09:00').split(':').map(Number);

  const targetDate = new Date(y, m - 1, d, hour, min, 0, 0);
  const offsetMinutes = getTimingOffsetMinutes(task.reminderTiming);

  return targetDate.getTime() - offsetMinutes * 60 * 1000;
}

function getTimingOffsetMinutes(timing: ReminderTiming): number {
  switch (timing) {
    case '5m_before':
      return 5;
    case '15m_before':
      return 15;
    case '30m_before':
      return 30;
    case '1h_before':
      return 60;
    case '1d_before':
      return 24 * 60;
    case 'at_time':
    default:
      return 0;
  }
}

// Check which tasks need reminders right now
export function checkDueReminders(tasks: Task[]): Task[] {
  const now = Date.now();
  const triggered: Task[] = [];

  tasks.forEach((task) => {
    if (task.completed) return;
    if (task.reminderTriggered && !task.reminderSnoozedUntil) return;

    const targetTime = getReminderTargetTimestamp(task);
    if (targetTime && now >= targetTime && now - targetTime <= 1000 * 60 * 60 * 12) {
      triggered.push(task);
    }
  });

  return triggered;
}

export function triggerTaskAlert(task: Task) {
  soundFx.playReminderChime();
  const timeInfo = task.dueTime ? ` ម៉ោង ${formatKhmerTime(task.dueTime)}` : '';
  sendBrowserNotification(
    `⏰ រំលឹកកិច្ចការ៖ ${task.title}`,
    `ដល់ពេលអនុវត្តកិច្ចការរបស់អ្នកហើយ!${timeInfo} (កម្រិតអាទិភាព៖ ${task.priority})`,
    undefined,
    {
      tag: `task-${task.id}`,
      vibrate: [300, 100, 300, 100, 300],
      requireInteraction: true,
      data: { taskId: task.id, url: window.location.href },
    }
  );
}

// Test Lock Screen Notification immediately or with countdown (for user to lock screen)
export function scheduleLockScreenTestNotification(delaySeconds: number = 5): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      soundFx.playReminderChime();
      await sendBrowserNotification(
        '🔔 សាកល្បង Notification លើទូរស័ព្ទ (Lock Screen Test)',
        'កិច្ចការរំលឹករបស់អ្នកដំណើរការយ៉ាងល្អលើ Lock Screen & Mobile Notifications! ✨',
        undefined,
        {
          tag: 'lockscreen-test-' + Date.now(),
          vibrate: [300, 150, 300, 150, 400],
          requireInteraction: true,
        }
      );
      resolve();
    }, delaySeconds * 1000);
  });
}
