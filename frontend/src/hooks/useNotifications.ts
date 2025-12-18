import { useContext } from 'react';
import { NotificationContext } from '../context/NotificationContext';

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }

  return {
    notifications: context.notifications,
    unread: context.unread,
    settings: context.settings,
    
    // Methods
    loadNotifications: context.loadNotifications,
    loadSettings: context.loadSettings,
    markAsRead: context.markAsRead,
    markAllAsRead: context.markAllAsRead,
    deleteNotification: context.deleteNotification,
    
    // Sound & Push
    playSound: context.playSound,
    sendBrowserNotification: context.sendBrowserNotification,
    requestNotificationPermission: context.requestNotificationPermission,
    browserNotificationSupported: context.browserNotificationSupported,
  };
}

export default useNotifications;
