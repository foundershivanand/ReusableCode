import { randomUUID } from "node:crypto";
import {
  ChangelogItem,
  RoadmapItem,
  CreateChangelogInput,
  ChangelogStatus,
  TargetAudience,
} from "../schemas/changelog-schemas.js";
import { ChangelogRepository } from "./repository.js";

export class ChangelogService {
  constructor(private repository: ChangelogRepository) {}

  sanitizeMarkdown(content: string): string {
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
      .replace(/href=["']javascript:[^"']*["']/gi, 'href="#"');
  }

  validateLinks(content: string): { valid: boolean; brokenLinks: string[] } {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const broken: string[] = [];
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const url = match[2].trim();
      if (url.startsWith("#") || url.startsWith("/")) continue;
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          broken.push(url);
        }
      } catch {
        broken.push(url);
      }
    }

    return { valid: broken.length === 0, brokenLinks: broken };
  }

  async createChangelog(
    input: CreateChangelogInput,
    authorId: string
  ): Promise<ChangelogItem> {
    const existing = await this.repository.getChangelogBySlug(input.slug);
    if (existing) {
      throw new Error(`Changelog slug '${input.slug}' is already taken`);
    }

    const sanitizedContent = this.sanitizeMarkdown(input.contentMarkdown);

    const item: ChangelogItem = {
      id: randomUUID(),
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      contentMarkdown: sanitizedContent,
      category: input.category || "FEATURE",
      status: "DRAFT",
      versionTag: input.versionTag || null,
      relatedFeatureFlag: input.relatedFeatureFlag || null,
      targetAudience: input.targetAudience || "ALL",
      authorId,
      publishedAt: null,
      scheduledFor: input.scheduledFor || null,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.repository.saveChangelog(item);
    return item;
  }

  async updateStatus(params: {
    id: string;
    newStatus: ChangelogStatus;
    userRole: string;
  }): Promise<ChangelogItem> {
    const item = await this.repository.getChangelogById(params.id);
    if (!item) {
      throw new Error(`Changelog item ${params.id} not found`);
    }

    // Publication permission check
    if (params.newStatus === "PUBLISHED" || params.newStatus === "SCHEDULED") {
      const canPublish = ["admin", "publisher", "superadmin"].includes(params.userRole);
      if (!canPublish) {
        throw new Error("Insufficient permissions: Only publishers and admins can publish changelogs");
      }

      // Link validation before publication
      const linkCheck = this.validateLinks(item.contentMarkdown);
      if (!linkCheck.valid) {
        throw new Error(`Cannot publish: invalid links detected: ${linkCheck.brokenLinks.join(", ")}`);
      }

      if (params.newStatus === "PUBLISHED" && !item.publishedAt) {
        item.publishedAt = new Date().toISOString();
      }
    }

    item.status = params.newStatus;
    item.updatedAt = new Date().toISOString();
    await this.repository.saveChangelog(item);
    return item;
  }

  async getPublishedChangelogs(audience: TargetAudience = "ALL"): Promise<ChangelogItem[]> {
    return this.repository.listChangelogs({ status: "PUBLISHED", audience });
  }

  async getUnreadChangelogs(
    userId: string,
    audience: TargetAudience = "ALL"
  ): Promise<ChangelogItem[]> {
    const published = await this.getPublishedChangelogs(audience);
    const readIds = await this.repository.getUserReadIds(userId);
    return published.filter((item) => !readIds.has(item.id));
  }

  async markAsRead(userId: string, changelogId: string, deviceId?: string): Promise<void> {
    await this.repository.recordRead({
      userId,
      changelogId,
      deviceId,
      readAt: new Date().toISOString(),
    });
  }

  async createRoadmapItem(params: {
    title: string;
    description: string;
    targetQuarter: string;
  }): Promise<RoadmapItem> {
    const item: RoadmapItem = {
      id: randomUUID(),
      title: params.title,
      description: params.description,
      status: "PLANNED",
      targetQuarter: params.targetQuarter,
      upvotesCount: 0,
      changelogId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.repository.saveRoadmap(item);
    return item;
  }

  async upvoteRoadmapItem(userId: string, roadmapId: string): Promise<boolean> {
    return this.repository.recordUpvote(userId, roadmapId);
  }

  async completeRoadmapItem(roadmapId: string, changelogId: string): Promise<RoadmapItem> {
    const item = await this.repository.getRoadmapById(roadmapId);
    if (!item) {
      throw new Error(`Roadmap item ${roadmapId} not found`);
    }
    item.status = "COMPLETED";
    item.changelogId = changelogId;
    item.updatedAt = new Date().toISOString();
    await this.repository.saveRoadmap(item);
    return item;
  }
}
