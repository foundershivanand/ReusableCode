import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { NotificationRecord, NotificationPreferences } from "../schemas/index.js";
import { NotificationClient } from "./notification-client.js";

interface NotificationContextValue {
  client: NotificationClient;
  notifications: NotificationRecord[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  loading: boolean;
  error: Error | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
}

const NotificationReactContext = createContext<NotificationContextValue | null>(null);

export interface NotificationProviderProps {
  client: NotificationClient;
  children: React.ReactNode;
}

export const NotificationCenterProvider: React.FC<NotificationProviderProps> = ({ client, children }) => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshNotifications = useCallback(async () => {
    try {
      const [list, prefs] = await Promise.all([
        client.listInApp(false),
        client.getPreferences()
      ]);
      setNotifications(list);
      setPreferences(prefs);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const markAsRead = async (id: string) => {
    await client.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date() } : n))
    );
  };

  const markAllAsRead = async () => {
    await client.markAllAsRead();
    const now = new Date();
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: now })));
  };

  const updatePreferences = async (prefs: Partial<NotificationPreferences>) => {
    const updated = await client.updatePreferences(prefs);
    setPreferences(updated);
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <NotificationReactContext.Provider
      value={{
        client,
        notifications,
        unreadCount,
        preferences,
        loading,
        error,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        updatePreferences
      }}
    >
      {children}
    </NotificationReactContext.Provider>
  );
};

export function useNotificationCenter(): NotificationContextValue {
  const ctx = useContext(NotificationReactContext);
  if (!ctx) {
    throw new Error("useNotificationCenter must be used within a NotificationCenterProvider");
  }
  return ctx;
}
