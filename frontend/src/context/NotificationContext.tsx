import { createContext, useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "./AuthContext";
import { io } from "socket.io-client";
import {
  soundManager,
  requestNotificationPermission,
  sendBrowserNotification,
  isNotificationSupported
} from "../utils/soundManager";

export const NotificationContext = createContext<any>(null);

let socket: any = null;

export function NotificationProvider({ children }) {
  const { user } = useContext(AuthContext);

  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [settings, setSettings] = useState<any>(null);
  const [browserNotificationSupported] = useState(
    isNotificationSupported()
  );

  // Load notification settings
  async function loadSettings() {
    if (!user) return;
    try {
      const res = await api.get("/notification-settings");
      setSettings(res.data);

      // Update sound manager with user preferences
      soundManager.setEnabled(res.data.soundAlerts !== false);
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  }

  // Load notifications from API
  async function loadNotifications() {
    if (!user) return;
    try {
      const res = await api.get("/notifications", { params: { limit: 50 } });
      setNotifications(res.data.notifications || []);

      const unreadCount = res.data.notifications?.filter((n: any) => !n.read).length || 0;
      setUnread(unreadCount);
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  }

  // Mark notification as read
  async function markAsRead(id: string) {
    try {
      await api.patch(`/notifications/${id}/read`);
      loadNotifications();
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }

  // Mark all notifications as read
  async function markAllAsRead() {
    try {
      await api.patch("/notifications/mark-all/read");
      loadNotifications();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  }

  // Delete notification
  async function deleteNotification(id: string) {
    try {
      await api.delete(`/notifications/${id}`);
      loadNotifications();
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  }

  // Play sound alert with improved error handling
  function playSound() {
    if (!settings?.soundAlerts) return;

    try {
      // Try to use Web Audio API first (more reliable)
      soundManager.setEnabled(true);
      soundManager.playNotificationPattern();
    } catch (err) {
      console.log("Web Audio notification failed, trying HTML5 Audio");
      try {
        soundManager.playSound('ding');
      } catch (fallbackErr) {
        console.log("Audio notification not available");
      }
    }
  }

  // Request browser notification permission
  async function requestNotificationPermissionFn() {
    return await requestNotificationPermission();
  }

  // Send browser push notification
  function sendBrowserNotificationFn(title: string, options: any = {}) {
    if (!browserNotificationSupported || !settings?.pushNotifications) return;

    sendBrowserNotification(title, {
      ...options,
    });
  }

  // Setup realtime socket listener
  useEffect(() => {
    if (!user) return;

    if (!socket) {
      // Get backend URL from environment variable
      const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3232';

      socket = io(backendUrl, {
        transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      const token = localStorage.getItem("token");
      if (token) {
        socket.emit("join", token);
      }

      // Add connection error handling
      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      socket.on('connect', () => {
        console.log('Socket connected successfully');
      });
    }

    socket.on("notification", (data: any) => {
      // Check if notification should be added based on settings
      const shouldAdd = !settings || settings.frequency !== 'never';

      if (shouldAdd) {
        // Play sound if enabled
        if (data.playSound && settings?.soundAlerts) {
          playSound();
        }

        // Send browser push if enabled
        if (data.sendPush && settings?.pushNotifications) {
          sendBrowserNotificationFn(data.title, {
            body: data.body,
            tag: data._id,
          });
        }

        setNotifications((prev: any) => [data, ...prev]);
        setUnread((prev: number) => prev + 1);
      }
    });

    loadSettings();
    loadNotifications();
    requestNotificationPermissionFn();

    return () => {
      if (!socket) return;
      socket.off("notification");
    };
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unread,
        settings,
        loadNotifications,
        loadSettings,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        playSound,
        sendBrowserNotification: sendBrowserNotificationFn,
        requestNotificationPermission: requestNotificationPermissionFn,
        browserNotificationSupported,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

