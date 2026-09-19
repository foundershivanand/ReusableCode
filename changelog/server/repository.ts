import {
  ChangelogItem,
  RoadmapItem,
  UserReadState,
} from "../schemas/changelog-schemas.js";

export interface ChangelogRepository {
  getChangelogById(id: string): Promise<ChangelogItem | null>;
  getChangelogBySlug(slug: string): Promise<ChangelogItem | null>;
  listChangelogs(options?: { status?: string; audience?: string }): Promise<ChangelogItem[]>;
  saveChangelog(item: ChangelogItem): Promise<void>;
  deleteChangelog(id: string): Promise<void>;
  listRoadmap(status?: string): Promise<RoadmapItem[]>;
  getRoadmapById(id: string): Promise<RoadmapItem | null>;
  saveRoadmap(item: RoadmapItem): Promise<void>;
  deleteRoadmap(id: string): Promise<void>;
  recordRead(state: UserReadState): Promise<void>;
  getUserReadIds(userId: string): Promise<Set<string>>;
  recordUpvote(userId: string, roadmapId: string): Promise<boolean>; // false if already upvoted
}

export class InMemoryChangelogRepository implements ChangelogRepository {
  private changelogs = new Map<string, ChangelogItem>();
  private roadmapItems = new Map<string, RoadmapItem>();
  private readStates = new Map<string, UserReadState>(); // key: `${userId}:${changelogId}`
  private upvotes = new Set<string>(); // key: `${userId}:${roadmapId}`

  async getChangelogById(id: string): Promise<ChangelogItem | null> {
    const item = this.changelogs.get(id);
    return item ? { ...item } : null;
  }

  async getChangelogBySlug(slug: string): Promise<ChangelogItem | null> {
    for (const item of this.changelogs.values()) {
      if (item.slug === slug) return { ...item };
    }
    return null;
  }

  async listChangelogs(options?: { status?: string; audience?: string }): Promise<ChangelogItem[]> {
    return Array.from(this.changelogs.values())
      .filter((item) => {
        if (options?.status && item.status !== options.status) return false;
        if (options?.audience && item.targetAudience !== "ALL" && item.targetAudience !== options.audience) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : new Date(a.createdAt).getTime();
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
  }

  async saveChangelog(item: ChangelogItem): Promise<void> {
    this.changelogs.set(item.id, { ...item });
  }

  async deleteChangelog(id: string): Promise<void> {
    this.changelogs.delete(id);
  }

  async listRoadmap(status?: string): Promise<RoadmapItem[]> {
    return Array.from(this.roadmapItems.values())
      .filter((r) => (!status ? true : r.status === status))
      .sort((a, b) => b.upvotesCount - a.upvotesCount);
  }

  async getRoadmapById(id: string): Promise<RoadmapItem | null> {
    const item = this.roadmapItems.get(id);
    return item ? { ...item } : null;
  }

  async saveRoadmap(item: RoadmapItem): Promise<void> {
    this.roadmapItems.set(item.id, { ...item });
  }

  async deleteRoadmap(id: string): Promise<void> {
    this.roadmapItems.delete(id);
  }

  async recordRead(state: UserReadState): Promise<void> {
    const key = `${state.userId}:${state.changelogId}`;
    this.readStates.set(key, { ...state });
  }

  async getUserReadIds(userId: string): Promise<Set<string>> {
    const set = new Set<string>();
    for (const state of this.readStates.values()) {
      if (state.userId === userId) {
        set.add(state.changelogId);
      }
    }
    return set;
  }

  async recordUpvote(userId: string, roadmapId: string): Promise<boolean> {
    const key = `${userId}:${roadmapId}`;
    if (this.upvotes.has(key)) return false;
    this.upvotes.add(key);
    const item = this.roadmapItems.get(roadmapId);
    if (item) {
      item.upvotesCount += 1;
      item.updatedAt = new Date().toISOString();
    }
    return true;
  }
}
