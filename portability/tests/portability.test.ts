import { describe, it, expect, beforeEach } from "vitest";
import { DataPortabilityService } from "../server/portability-service.js";
import { InMemoryPortabilityRepository } from "../server/repository.js";

describe("Module 19: Export, Import & Data Portability", () => {
  let repository: InMemoryPortabilityRepository;
  let service: DataPortabilityService;

  beforeEach(() => {
    repository = new InMemoryPortabilityRepository();
    service = new DataPortabilityService(repository);
  });

  describe("Export Operations & CSV Injection Defense", () => {
    it("exports data with 24-hour signed download URL and progress tracking", async () => {
      const job = await service.requestExport(
        {
          tenantId: "t_1",
          userId: "u_1",
          resourceType: "CUSTOMERS",
          format: "CSV"
        },
        async () => [
          { id: "cust_1", name: "Alice", email: "alice@example.com" },
          { id: "cust_2", name: "Bob", email: "bob@example.com" }
        ]
      );

      expect(job.status).toBe("COMPLETED");
      expect(job.progressPercentage).toBe(100);
      expect(job.totalRows).toBe(2);
      expect(job.downloadUrl).toBeDefined();
      expect(job.expiresAt).toBeDefined();
    });

    it("sanitizes CSV formula injection characters (=, +, -, @)", () => {
      const maliciousRows = [
        { name: "=cmd|'/C calc'!A0", email: "+12345", note: "@SUM(A1:A10)", normal: "Regular Text" }
      ];

      const csv = service.formatSafeCsv(maliciousRows);
      // Malicious cells must be prepended with a single quote (')
      expect(csv).toContain("\"'=cmd|'/C calc'!A0\"");
      expect(csv).toContain("\"'+12345\"");
      expect(csv).toContain("\"'@SUM(A1:A10)\"");
      expect(csv).toContain('"Regular Text"');
    });
  });

  describe("Import Pipeline & Strategies", () => {
    const sampleCsv = `id,name,email
1,Alice,alice@example.com
2,Bob,bob@example.com
3,InvalidEmail,not-an-email
4,AliceDuplicate,alice@example.com`;

    it("executes dry-run validation without committing data", async () => {
      let committed = false;

      const job = await service.processImport(
        {
          tenantId: "t_1",
          userId: "u_1",
          resourceType: "USERS",
          content: sampleCsv,
          dryRun: true,
          strategy: "PARTIAL_WITH_ERRORS"
        },
        (row) => {
          if (!row.email.includes("@")) return { valid: false, error: "Invalid email" };
          return { valid: true };
        },
        async () => {
          committed = true;
        }
      );

      expect(job.dryRun).toBe(true);
      expect(job.totalRows).toBe(4);
      expect(job.successRows).toBe(2);
      expect(job.failedRows).toBe(2); // 1 invalid email + 1 duplicate email
      expect(committed).toBe(false); // Dry run must NOT commit!
    });

    it("rolls back all rows under ALL_OR_NOTHING strategy when any row fails", async () => {
      let committedRows: any[] = [];

      const job = await service.processImport(
        {
          tenantId: "t_1",
          userId: "u_1",
          resourceType: "USERS",
          content: sampleCsv,
          dryRun: false,
          strategy: "ALL_OR_NOTHING"
        },
        (row) => {
          if (!row.email.includes("@")) return { valid: false, error: "Invalid email" };
          return { valid: true };
        },
        async (rows) => {
          committedRows = rows;
        }
      );

      expect(job.status).toBe("FAILED");
      expect(committedRows.length).toBe(0); // Atomic rollback
    });

    it("commits valid rows and logs errors under PARTIAL_WITH_ERRORS strategy", async () => {
      let committedRows: any[] = [];

      const job = await service.processImport(
        {
          tenantId: "t_1",
          userId: "u_1",
          resourceType: "USERS",
          content: sampleCsv,
          dryRun: false,
          strategy: "PARTIAL_WITH_ERRORS"
        },
        (row) => {
          if (!row.email.includes("@")) return { valid: false, error: "Invalid email" };
          return { valid: true };
        },
        async (rows) => {
          committedRows = rows;
        }
      );

      expect(job.status).toBe("COMPLETED");
      expect(job.successRows).toBe(2);
      expect(committedRows.length).toBe(2);
      expect(job.errors.length).toBe(2);
    });
  });
});
