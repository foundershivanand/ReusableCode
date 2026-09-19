import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryChangelogRepository, ChangelogService } from "../server/index.js";

describe("Module 24: Changelog, Roadmap & What's New", () => {
  let repo: InMemoryChangelogRepository;
  let service: ChangelogService;

  beforeEach(() => {
    repo = new InMemoryChangelogRepository();
    service = new ChangelogService(repo);
  });

  it("should create a changelog item in DRAFT status and enforce slug uniqueness", async () => {
    const item = await service.createChangelog(
      {
        slug: "ai-assistant-v2",
        title: "AI Assistant V2 Released",
        summary: "Faster and more capable generative AI.",
        contentMarkdown: "### Highlights\nNew models and lower latency.",
        category: "FEATURE",
      },
      "author-123"
    );

    expect(item.status).toBe("DRAFT");
    expect(item.slug).toBe("ai-assistant-v2");

    // Duplicate slug should reject
    await expect(
      service.createChangelog(
        {
          slug: "ai-assistant-v2",
          title: "Another title",
          summary: "...",
          contentMarkdown: "...",
        },
        "author-456"
      )
    ).rejects.toThrow("already taken");
  });

  it("should sanitize markdown content to eliminate malicious scripts and iframes", async () => {
    const malicious = "Hello <script>alert('pwned')</script> and <iframe src='http://bad.com'></iframe> world!";
    const item = await service.createChangelog(
      {
        slug: "security-update-1",
        title: "Security Update",
        summary: "Important fixes",
        contentMarkdown: malicious,
      },
      "author-123"
    );

    expect(item.contentMarkdown).not.toContain("<script>");
    expect(item.contentMarkdown).not.toContain("<iframe");
    expect(item.contentMarkdown).toBe("Hello  and  world!");
  });

  it("should reject publishing if broken links exist in content", async () => {
    const item = await service.createChangelog(
      {
        slug: "broken-links-post",
        title: "Broken Link Post",
        summary: "Check it out",
        contentMarkdown: "Here is a broken link: [Bad Link](htp:/invalid-url)",
      },
      "author-123"
    );

    await expect(
      service.updateStatus({
        id: item.id,
        newStatus: "PUBLISHED",
        userRole: "publisher",
      })
    ).rejects.toThrow("Cannot publish: invalid links detected");
  });

  it("should enforce publisher permissions before transitioning to PUBLISHED", async () => {
    const item = await service.createChangelog(
      {
        slug: "valid-post",
        title: "Valid Post",
        summary: "Valid summary",
        contentMarkdown: "Check [Docs](https://example.com/docs) for info.",
      },
      "author-123"
    );

    // Regular author cannot publish
    await expect(
      service.updateStatus({
        id: item.id,
        newStatus: "PUBLISHED",
        userRole: "contributor",
      })
    ).rejects.toThrow("Insufficient permissions");

    // Publisher can publish
    const published = await service.updateStatus({
      id: item.id,
      newStatus: "PUBLISHED",
      userRole: "publisher",
    });

    expect(published.status).toBe("PUBLISHED");
    expect(published.publishedAt).toBeDefined();
  });

  it("should track multi-device unread states accurately", async () => {
    const item = await service.createChangelog(
      {
        slug: "unread-test",
        title: "Unread Test",
        summary: "Summary",
        contentMarkdown: "Content",
      },
      "admin-1"
    );

    await service.updateStatus({
      id: item.id,
      newStatus: "PUBLISHED",
      userRole: "admin",
    });

    const user1 = "user-abc";
    const unreadBefore = await service.getUnreadChangelogs(user1);
    expect(unreadBefore).toHaveLength(1);

    // Mark as read on mobile device
    await service.markAsRead(user1, item.id, "device-iphone-14");

    // Read on desktop should now also be false
    const unreadAfter = await service.getUnreadChangelogs(user1);
    expect(unreadAfter).toHaveLength(0);
  });

  it("should filter changelogs by target audience", async () => {
    const betaItem = await service.createChangelog(
      {
        slug: "beta-feature",
        title: "Beta Feature",
        summary: "Summary",
        contentMarkdown: "Content",
        targetAudience: "BETA_USERS",
      },
      "admin-1"
    );
    await service.updateStatus({ id: betaItem.id, newStatus: "PUBLISHED", userRole: "admin" });

    const allAudience = await service.getPublishedChangelogs("ALL");
    expect(allAudience.find((i) => i.id === betaItem.id)).toBeUndefined();

    const betaAudience = await service.getPublishedChangelogs("BETA_USERS");
    expect(betaAudience.find((i) => i.id === betaItem.id)).toBeDefined();
  });

  it("should manage roadmap items, upvoting, and completion linking", async () => {
    const roadmap = await service.createRoadmapItem({
      title: "Dark Mode Support",
      description: "Full dark theme across all UI pages.",
      targetQuarter: "2026-Q4",
    });

    expect(roadmap.status).toBe("PLANNED");
    expect(roadmap.upvotesCount).toBe(0);

    // Upvote by user 1
    const upvoted1 = await service.upvoteRoadmapItem("user-1", roadmap.id);
    expect(upvoted1).toBe(true);

    // Duplicate upvote by user 1 should fail
    const upvotedAgain = await service.upvoteRoadmapItem("user-1", roadmap.id);
    expect(upvotedAgain).toBe(false);

    // Complete roadmap item
    const completed = await service.completeRoadmapItem(roadmap.id, "changelog-id-123");
    expect(completed.status).toBe("COMPLETED");
    expect(completed.changelogId).toBe("changelog-id-123");
  });
});
