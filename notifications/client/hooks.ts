import { useNotificationCenter } from "./react-context.js";

export function useNotifications() {
  const { notifications, unreadCount, loading, error, refreshNotifications, markAsRead, markAllAsRead } =
    useNotificationCenter();
  return {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead
  };
}

export function useNotificationPreferences() {
  const { preferences, loading, error, updatePreferences } = useNotificationCenter();
  return {
    preferences,
    loading,
    error,
    updatePreferences
  };
}
