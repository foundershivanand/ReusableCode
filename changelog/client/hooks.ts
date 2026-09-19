import { useChangelogContext } from "./react-context.js";

export function useChangelog() {
  const { changelogs, unreadChangelogs, unreadCount, markAsRead, refresh } = useChangelogContext();
  return { changelogs, unreadChangelogs, unreadCount, markAsRead, refresh };
}

export function useWhatsNew() {
  const { unreadChangelogs, unreadCount, markAsRead } = useChangelogContext();
  return {
    hasUnread: unreadCount > 0,
    unreadCount,
    unreadItems: unreadChangelogs,
    markAsRead,
  };
}

export function useRoadmap() {
  const { roadmapItems, upvoteRoadmap, refresh } = useChangelogContext();
  return { roadmapItems, upvoteRoadmap, refresh };
}
