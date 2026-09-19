import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { ChangelogItem, RoadmapItem } from "../schemas/changelog-schemas.js";
import { ChangelogClient } from "./changelog-client.js";

export interface ChangelogContextValue {
  changelogs: ChangelogItem[];
  unreadChangelogs: ChangelogItem[];
  unreadCount: number;
  roadmapItems: RoadmapItem[];
  markAsRead: (changelogId: string) => Promise<void>;
  upvoteRoadmap: (roadmapId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const ChangelogContext = createContext<ChangelogContextValue | null>(null);

export interface ChangelogProviderProps {
  client?: ChangelogClient;
  userId?: string;
  audience?: string;
  deviceId?: string;
  children: React.ReactNode;
}

export const ChangelogProvider: React.FC<ChangelogProviderProps> = ({
  client,
  userId,
  audience = "ALL",
  deviceId,
  children,
}) => {
  const [changelogs, setChangelogs] = useState<ChangelogItem[]>([]);
  const [unreadChangelogs, setUnreadChangelogs] = useState<ChangelogItem[]>([]);
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);

  const changelogClient = useMemo(() => client || new ChangelogClient(), [client]);

  const refresh = useCallback(async () => {
    try {
      const items = await changelogClient.getPublished(audience);
      setChangelogs(items);

      if (userId) {
        const unread = await changelogClient.getUnread(userId, audience);
        setUnreadChangelogs(unread);
      } else {
        setUnreadChangelogs([]);
      }

      const roadmap = await changelogClient.getRoadmap();
      setRoadmapItems(roadmap);
    } catch {
      // Graceful fallback
    }
  }, [changelogClient, userId, audience]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markAsRead = useCallback(
    async (changelogId: string) => {
      if (!userId) return;
      await changelogClient.markRead(userId, changelogId, deviceId);
      setUnreadChangelogs((prev) => prev.filter((c) => c.id !== changelogId));
    },
    [changelogClient, userId, deviceId]
  );

  const upvoteRoadmap = useCallback(
    async (roadmapId: string) => {
      if (!userId) return false;
      const success = await changelogClient.upvoteRoadmap(roadmapId, userId);
      if (success) {
        setRoadmapItems((prev) =>
          prev.map((item) =>
            item.id === roadmapId ? { ...item, upvotesCount: item.upvotesCount + 1 } : item
          )
        );
      }
      return success;
    },
    [changelogClient, userId]
  );

  return (
    <ChangelogContext.Provider
      value={{
        changelogs,
        unreadChangelogs,
        unreadCount: unreadChangelogs.length,
        roadmapItems,
        markAsRead,
        upvoteRoadmap,
        refresh,
      }}
    >
      {children}
    </ChangelogContext.Provider>
  );
};

export function useChangelogContext(): ChangelogContextValue {
  const ctx = useContext(ChangelogContext);
  if (!ctx) {
    throw new Error("useChangelogContext must be used within a ChangelogProvider");
  }
  return ctx;
}
