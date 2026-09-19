import { describe, it, expect, beforeEach } from "vitest";
import { GlobalSearchService } from "../server/search-service.js";
import { InMemorySearchRepository } from "../server/repository.js";
import { CommandRegistry } from "../server/command-registry.js";

describe("Module 17: Global Search & Command Palette", () => {
  let repository: InMemorySearchRepository;
  let registry: CommandRegistry;
  let service: GlobalSearchService;

  beforeEach(async () => {
    repository = new InMemorySearchRepository();
    registry = new CommandRegistry();
    service = new GlobalSearchService(repository, registry);

    // Register test commands
    registry.registerCommands([
      {
        id: "cmd_dashboard",
        title: "Go to Dashboard",
        category: "NAVIGATION",
        shortcut: "G D",
        requiredRoles: [],
        requiredPermissions: []
      },
      {
        id: "cmd_billing",
        title: "View Billing & Invoices",
        category: "SETTINGS",
        requiredRoles: ["ADMIN", "BILLING_MANAGER"],
        requiredPermissions: ["billing.read"]
      },
      {
        id: "cmd_delete_workspace",
        title: "Delete Workspace",
        category: "ACTIONS",
        isDestructive: true,
        requiredRoles: ["OWNER"],
        requiredPermissions: ["workspace.delete"]
      }
    ]);

    // Index test documents
    await service.indexDocument({
      id: "doc_public_project",
      tenantId: "t_1",
      type: "PROJECT",
      title: "Public Product Roadmap 2026",
      content: "Detailed milestones for our Q1 and Q2 product feature rollout.",
      url: "/projects/roadmap",
      allowedRoles: [],
      allowedUserIds: []
    });

    await service.indexDocument({
      id: "doc_admin_invoice",
      tenantId: "t_1",
      type: "INVOICE",
      title: "Invoice #INV-2026-001",
      content: "Payment of $10,000 for enterprise subscription plan.",
      url: "/invoices/001",
      allowedRoles: ["ADMIN"],
      allowedUserIds: []
    });

    await service.indexDocument({
      id: "doc_deleted",
      tenantId: "t_1",
      type: "DOCUMENT",
      title: "Deleted Confidential Document",
      content: "This content should not be discoverable in search.",
      url: "/docs/deleted",
      isDeleted: true
    });
  });

  it("filters search results strictly by user roles (RBAC isolation)", async () => {
    // Normal MEMBER search
    const memberResults = await service.search({
      tenantId: "t_1",
      userId: "u_member",
      userRoles: ["MEMBER"],
      query: "Roadmap"
    });
    expect(memberResults.length).toBe(1);
    expect(memberResults[0].id).toBe("doc_public_project");

    // Normal MEMBER searching for invoice
    const memberInvoiceSearch = await service.search({
      tenantId: "t_1",
      userId: "u_member",
      userRoles: ["MEMBER"],
      query: "Invoice"
    });
    expect(memberInvoiceSearch.length).toBe(0); // Hidden from MEMBER

    // ADMIN searching for invoice
    const adminInvoiceSearch = await service.search({
      tenantId: "t_1",
      userId: "u_admin",
      userRoles: ["ADMIN"],
      query: "Invoice"
    });
    expect(adminInvoiceSearch.length).toBe(1);
    expect(adminInvoiceSearch[0].id).toBe("doc_admin_invoice");
  });

  it("never returns deleted documents in search results", async () => {
    const results = await service.search({
      tenantId: "t_1",
      userId: "u_admin",
      userRoles: ["ADMIN"],
      query: "Confidential"
    });
    expect(results.length).toBe(0);
  });

  it("sanitizes query against wildcard abuse and limits length", async () => {
    const results = await service.search({
      tenantId: "t_1",
      userId: "u_member",
      userRoles: [],
      query: "Roadmap.*+?^${}()|[]"
    });
    // Characters stripped, still matches Roadmap cleanly
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("doc_public_project");
  });

  it("filters command registry actions based on user roles and permissions", () => {
    const memberCommands = service.getAvailableCommands(["MEMBER"], []);
    expect(memberCommands.map((c) => c.id)).toEqual(["cmd_dashboard"]);

    const adminCommands = service.getAvailableCommands(
      ["ADMIN", "BILLING_MANAGER"],
      ["billing.read"]
    );
    expect(adminCommands.map((c) => c.id)).toContain("cmd_dashboard");
    expect(adminCommands.map((c) => c.id)).toContain("cmd_billing");
    expect(adminCommands.map((c) => c.id)).not.toContain("cmd_delete_workspace");
  });

  it("handles reindexing pipeline with progress tracking", async () => {
    const reindexProgress = await service.triggerReindex("t_1", [
      {
        id: "new_doc_1",
        tenantId: "t_1",
        type: "PROJECT",
        title: "Reindexed Project A",
        content: "Content A",
        url: "/projects/a"
      },
      {
        id: "new_doc_2",
        tenantId: "t_1",
        type: "PROJECT",
        title: "Reindexed Project B",
        content: "Content B",
        url: "/projects/b"
      }
    ]);

    expect(reindexProgress.status).toBe("COMPLETED");
    expect(reindexProgress.totalDocuments).toBe(2);
    expect(reindexProgress.processedDocuments).toBe(2);
    expect(reindexProgress.failedDocuments).toBe(0);
  });
});
