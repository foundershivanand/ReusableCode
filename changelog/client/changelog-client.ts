import {
  ChangelogItem,
  RoadmapItem,
  CreateChangelogInput,
} from "../schemas/changelog-schemas.js";

export class ChangelogClient {
  constructor(
    private baseUrl: string = "/api/changelog",
    private headers: Record<string, string> = {}
  ) {}

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...this.headers,
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(errorData.message || `Changelog API error: ${res.status}`);
    }

    return res.json();
  }

  async getPublished(audience: string = "ALL"): Promise<ChangelogItem[]> {
    return this.request<ChangelogItem[]>(`/items?audience=${encodeURIComponent(audience)}`);
  }

  async getUnread(userId: string, audience: string = "ALL"): Promise<ChangelogItem[]> {
    return this.request<ChangelogItem[]>(`/unread?userId=${encodeURIComponent(userId)}&audience=${encodeURIComponent(audience)}`);
  }

  async markRead(userId: string, changelogId: string, deviceId?: string): Promise<void> {
    return this.request<void>("/read", {
      method: "POST",
      body: JSON.stringify({ userId, changelogId, deviceId }),
    });
  }

  async getRoadmap(status?: string): Promise<RoadmapItem[]> {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request<RoadmapItem[]>(`/roadmap${q}`);
  }

  async upvoteRoadmap(roadmapId: string, userId: string): Promise<boolean> {
    return this.request<boolean>(`/roadmap/${encodeURIComponent(roadmapId)}/upvote`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  }

  async createChangelog(input: CreateChangelogInput): Promise<ChangelogItem> {
    return this.request<ChangelogItem>("/items", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
}
