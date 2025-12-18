import api from './axios';

/**
 * Fetch paginated notifications
 */
export const getNotifications = (page = 1, limit = 20, read?: 'true' | 'false') => {
  const params: any = { page, limit };
  if (read) params.read = read;
  return api.get('/notifications', { params });
};

/**
 * Get unread notification count
 */
export const getUnreadCount = () => {
  return api.get('/notifications/count/unread');
};

/**
 * Mark single notification as read
 */
export const markNotificationAsRead = (notificationId: string) => {
  return api.patch(`/notifications/${notificationId}/read`);
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = () => {
  return api.patch('/notifications/mark-all/read');
};

/**
 * Delete notification
 */
export const deleteNotification = (notificationId: string) => {
  return api.delete(`/notifications/${notificationId}`);
};

/**
 * Send notification (admin only)
 */
export const sendNotification = (
  userId: string,
  title: string,
  body?: string,
  meta?: any,
  playSoundAlert?: boolean
) => {
  return api.post('/notifications', {
    userId,
    title,
    body,
    meta,
    playSoundAlert,
  });
};

/**
 * Get user's notification settings
 */
export const getNotificationSettings = () => {
  return api.get('/notification-settings');
};

/**
 * Update notification settings
 */
export const updateNotificationSettings = (settings: any) => {
  return api.patch('/notification-settings', settings);
};

/**
 * Mute/unmute a project
 */
export const toggleProjectMute = (projectId: string) => {
  return api.post(`/notification-settings/mute-project/${projectId}`);
};

/**
 * Mute/unmute a task
 */
export const toggleTaskMute = (taskId: string) => {
  return api.post(`/notification-settings/mute-task/${taskId}`);
};

/**
 * Mute/unmute a user
 */
export const toggleUserMute = (userId: string) => {
  return api.post(`/notification-settings/mute-user/${userId}`);
};

export default {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  sendNotification,
  getNotificationSettings,
  updateNotificationSettings,
  toggleProjectMute,
  toggleTaskMute,
  toggleUserMute,
};
