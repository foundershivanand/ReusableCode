import React from "react";
import type { NotificationRecord } from "../schemas/index.js";

export interface NotificationListProps {
  notifications: NotificationRecord[];
  onMarkAsRead?: (id: string) => Promise<void>;
  className?: string;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onMarkAsRead,
  className = ""
}) => {
  if (notifications.length === 0) {
    return (
      <div className={`p-8 text-center text-gray-500 text-sm ${className}`}>
        No notifications yet.
      </div>
    );
  }

  return (
    <div className={`divide-y divide-gray-100 max-h-96 overflow-y-auto ${className}`}>
      {notifications.map((n) => {
        const isUnread = !n.readAt;
        return (
          <div
            key={n.id}
            className={`p-4 transition-colors flex items-start justify-between ${
              isUnread ? "bg-blue-50/40" : "bg-white hover:bg-gray-50"
            }`}
          >
            <div className="flex-1 pr-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {n.template.replace(/_/g, " ")}
                </span>
                {isUnread && (
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                )}
              </div>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {n.data.message || n.data.subject || `Update on ${n.template}`}
              </p>
              <span className="text-xs text-gray-400 mt-1 block">
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </div>
            {isUnread && onMarkAsRead && (
              <button
                type="button"
                onClick={() => onMarkAsRead(n.id)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap pt-1"
              >
                Mark read
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
