import React, { useState } from "react";
import type { NotificationRecord } from "../schemas/index.js";
import { NotificationBell } from "./NotificationBell.js";
import { NotificationList } from "./NotificationList.js";

export interface NotificationCenterProps {
  notifications: NotificationRecord[];
  unreadCount: number;
  onMarkAsRead?: (id: string) => Promise<void>;
  onMarkAllAsRead?: () => Promise<void>;
  onOpenPreferences?: () => void;
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onOpenPreferences,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <NotificationBell unreadCount={unreadCount} onClick={() => setIsOpen(!isOpen)} />

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 origin-top-right bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 border border-gray-200 focus:outline-none">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 text-xs">
              {unreadCount > 0 && onMarkAllAsRead && (
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark all read
                </button>
              )}
              {onOpenPreferences && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenPreferences();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                  title="Preferences"
                >
                  ⚙
                </button>
              )}
            </div>
          </div>

          <NotificationList
            notifications={notifications}
            onMarkAsRead={onMarkAsRead}
          />

          <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
