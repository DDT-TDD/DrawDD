/**
 * Toast Notification System for DRAWDD
 * Provides user-friendly notifications for errors, warnings, and success messages
 */

export type NotificationType = 'error' | 'warning' | 'success' | 'info';

export interface NotificationOptions {
  type?: NotificationType;
  duration?: number; // milliseconds, 0 = no auto-dismiss
  dismissible?: boolean;
}

const DEFAULT_DURATIONS: Record<NotificationType, number> = {
  error: 5000,
  warning: 4000,
  success: 3000,
  info: 3000,
};

const NOTIFICATION_COLORS: Record<NotificationType, { bg: string; text: string }> = {
  error: { bg: '#ef4444', text: '#ffffff' },
  warning: { bg: '#f59e0b', text: '#ffffff' },
  success: { bg: '#10b981', text: '#ffffff' },
  info: { bg: '#3b82f6', text: '#ffffff' },
};

/**
 * Show a toast notification
 */
export function showNotification(
  message: string,
  options: NotificationOptions = {}
): void {
  const {
    type = 'info',
    duration = DEFAULT_DURATIONS[type],
    dismissible = true,
  } = options;

  const colors = NOTIFICATION_COLORS[type];
  const isDark = document.documentElement.classList.contains('dark');

  const notification = document.createElement('div');
  notification.className = 'drawdd-notification';
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${colors.bg};
    color: ${colors.text};
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,${isDark ? '0.5' : '0.3'});
    z-index: 10000;
    max-width: 400px;
    font-size: 14px;
    font-family: system-ui, -apple-system, sans-serif;
    display: flex;
    align-items: center;
    gap: 12px;
    animation: slideIn 0.3s ease-out;
  `;

  // Add icon based on type
  const icon = document.createElement('span');
  icon.style.cssText = 'font-size: 18px; flex-shrink: 0;';
  icon.textContent = {
    error: '❌',
    warning: '⚠️',
    success: '✅',
    info: 'ℹ️',
  }[type];
  notification.appendChild(icon);

  // Add message
  const messageEl = document.createElement('span');
  messageEl.textContent = message;
  messageEl.style.cssText = 'flex: 1;';
  notification.appendChild(messageEl);

  // Add close button if dismissible
  if (dismissible) {
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: transparent;
      border: none;
      color: ${colors.text};
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0.8;
      transition: opacity 0.2s;
    `;
    closeBtn.onmouseenter = () => {
      closeBtn.style.opacity = '1';
    };
    closeBtn.onmouseleave = () => {
      closeBtn.style.opacity = '0.8';
    };
    closeBtn.onclick = () => {
      removeNotification(notification);
    };
    notification.appendChild(closeBtn);
  }

  // Add animation styles if not already present
  if (!document.getElementById('drawdd-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'drawdd-notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Auto-dismiss after duration
  if (duration > 0) {
    setTimeout(() => {
      removeNotification(notification);
    }, duration);
  }
}

/**
 * Remove a notification with animation
 */
function removeNotification(notification: HTMLElement): void {
  notification.style.animation = 'slideOut 0.3s ease-out';
  setTimeout(() => {
    notification.remove();
  }, 300);
}

/**
 * Show an error notification
 */
export function showErrorNotification(message: string, duration?: number): void {
  showNotification(message, { type: 'error', duration });
}

/**
 * Show a warning notification
 */
export function showWarningNotification(message: string, duration?: number): void {
  showNotification(message, { type: 'warning', duration });
}

/**
 * Show a success notification
 */
export function showSuccessNotification(message: string, duration?: number): void {
  showNotification(message, { type: 'success', duration });
}

/**
 * Show an info notification
 */
export function showInfoNotification(message: string, duration?: number): void {
  showNotification(message, { type: 'info', duration });
}
