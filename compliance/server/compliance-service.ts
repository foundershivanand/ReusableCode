import { createHash, randomUUID } from "node:crypto";
import type { IComplianceRepository } from "./repository.js";
import {
  type ConsentEvidence,
  type DataSubjectRequest,
  type RetentionPolicy,
  type VendorProcessor,
  ConsentEvidenceSchema,
  DataSubjectRequestSchema
} from "../schemas/compliance-schemas.js";

export class ComplianceService {
  constructor(private readonly repository: IComplianceRepository) {}

  async recordConsent(input: Omit<ConsentEvidence, "id" | "acceptedAt" | "immutableHash">): Promise<ConsentEvidence> {
    const id = `consent_${Date.now()}_${randomUUID().substring(0, 6)}`;
    const acceptedAt = new Date();

    // Immutable hash evidence
    const hashPayload = `${id}:${input.userId}:${input.tenantId}:${input.termsVersion}:${input.privacyVersion}:${input.acceptedTerms}:${input.acceptedPrivacy}:${input.marketingConsent}:${acceptedAt.toISOString()}`;
    const immutableHash = createHash("sha256").update(hashPayload).digest("hex");

    const validated = ConsentEvidenceSchema.parse({
      ...input,
      id,
      acceptedAt,
      immutableHash
    });

    return this.repository.saveConsent(validated);
  }

  async withdrawConsent(
    userId: string,
    tenantId: string,
    withdraw: {
      marketing?: boolean;
      analyticsCookies?: boolean;
      functionalCookies?: boolean;
    }
  ): Promise<ConsentEvidence> {
    const latest = await this.repository.getLatestConsent(userId, tenantId);
    if (!latest) throw new Error("No existing consent record found to withdraw");

    return this.recordConsent({
      userId,
      tenantId,
      termsVersion: latest.termsVersion,
      privacyVersion: latest.privacyVersion,
      acceptedTerms: latest.acceptedTerms,
      acceptedPrivacy: latest.acceptedPrivacy,
      marketingConsent: withdraw.marketing ? false : latest.marketingConsent,
      cookieConsent: {
        ...latest.cookieConsent,
        analytics: withdraw.analyticsCookies ? false : latest.cookieConsent.analytics,
        functional: withdraw.functionalCookies ? false : latest.cookieConsent.functional
      },
      acceptedIp: latest.acceptedIp,
      userAgent: latest.userAgent,
      jurisdiction: latest.jurisdiction
    });
  }

  async submitDataSubjectRequest(
    userId: string,
    tenantId: string,
    userEmail: string,
    type: "ACCESS" | "EXPORT" | "CORRECTION" | "DELETION" | "RESTRICTION",
    reason?: string
  ): Promise<DataSubjectRequest> {
    // Check if user is subject to legal hold
    const isUnderHold = await this.repository.isUserUnderLegalHold(userId, tenantId);
    if (type === "DELETION" && isUnderHold) {
      const heldDsr: DataSubjectRequest = {
        id: `dsr_${Date.now()}_${randomUUID().substring(0, 6)}`,
        userId,
        tenantId,
        userEmail,
        type,
        status: "HELD_UNDER_LEGAL_HOLD",
        reason,
        identityVerified: false,
        submittedAt: new Date(),
        rejectionReason: "Account data is currently subject to a mandatory legal hold and cannot be deleted."
      };
      return this.repository.saveDsr(heldDsr);
    }

    const verificationToken = randomUUID();
    const dsr: DataSubjectRequest = {
      id: `dsr_${Date.now()}_${randomUUID().substring(0, 6)}`,
      userId,
      tenantId,
      userEmail,
      type,
      status: "VERIFYING_IDENTITY",
      reason,
      identityVerified: false,
      verificationToken,
      submittedAt: new Date()
    };

    const validated = DataSubjectRequestSchema.parse(dsr);
    return this.repository.saveDsr(validated);
  }

  async verifyDsrIdentity(requestId: string, token: string): Promise<DataSubjectRequest> {
    const dsr = await this.repository.getDsr(requestId);
    if (!dsr) throw new Error(`DSR '${requestId}' not found`);

    if (dsr.verificationToken !== token) {
      throw new Error("Invalid identity verification token");
    }

    dsr.identityVerified = true;
    dsr.status = "IN_PROGRESS";
    return this.repository.saveDsr(dsr);
  }

  async completeDsr(requestId: string, downloadUrl?: string): Promise<DataSubjectRequest> {
    const dsr = await this.repository.getDsr(requestId);
    if (!dsr) throw new Error(`DSR '${requestId}' not found`);

    dsr.status = "COMPLETED";
    dsr.completedAt = new Date();
    if (downloadUrl) {
      dsr.resultDownloadUrl = downloadUrl;
      dsr.downloadExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days TTL
    }

    return this.repository.saveDsr(dsr);
  }

  async setLegalHold(userId: string, tenantId: string, isHold: boolean): Promise<void> {
    return this.repository.setUserLegalHold(userId, tenantId, isHold);
  }

  async registerRetentionPolicy(policy: RetentionPolicy): Promise<RetentionPolicy> {
    return this.repository.saveRetentionPolicy(policy);
  }

  async listRetentionPolicies(): Promise<RetentionPolicy[]> {
    return this.repository.listRetentionPolicies();
  }

  async registerVendor(vendor: VendorProcessor): Promise<VendorProcessor> {
    return this.repository.saveVendor(vendor);
  }

  async listVendors(): Promise<VendorProcessor[]> {
    return this.repository.listVendors();
  }

  async getLatestConsent(userId: string, tenantId: string): Promise<ConsentEvidence | null> {
    return this.repository.getLatestConsent(userId, tenantId);
  }
}
