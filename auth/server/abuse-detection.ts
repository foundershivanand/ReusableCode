import crypto from "node:crypto";
import { AuditLogger } from "./audit-logger.js";
import { UserRecord } from "./repository.js";

export interface DeviceSignal {
  ip: string;
  userAgent?: string;
  acceptLanguage?: string;
}

export interface AbuseEvaluation {
  isSuspicious: boolean;
  isNewDevice: boolean;
  riskScore: number; // 0 (low) to 100 (critical)
  reasons: string[];
}

export interface KnownDeviceRecord {
  deviceHash: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  lastIp: string;
}

export class AbuseDetectionService {
  private auditLogger: AuditLogger;
  // In production, backed by persistent table: known_user_devices
  private userKnownDevices: Map<string, Map<string, KnownDeviceRecord>> = new Map();

  constructor(auditLogger: AuditLogger) {
    this.auditLogger = auditLogger;
  }

  /**
   * Computes a privacy-preserving cryptographic hash of the client device signals
   */
  computeDeviceHash(signals: DeviceSignal): string {
    const raw = `${signals.userAgent || "unknown"}|${signals.acceptLanguage || "unknown"}`;
    return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32);
  }

  /**
   * Evaluates login signals for abuse, novel devices, and unusual patterns
   * Principle: "Do not automatically lock accounts solely because of one noisy signal."
   */
  async evaluateLogin(
    user: UserRecord,
    signals: DeviceSignal
  ): Promise<AbuseEvaluation> {
    const deviceHash = this.computeDeviceHash(signals);
    let userDevices = this.userKnownDevices.get(user.id);

    if (!userDevices) {
      userDevices = new Map();
      this.userKnownDevices.set(user.id, userDevices);
    }

    const existingDevice = userDevices.get(deviceHash);
    const isNewDevice = !existingDevice;
    const reasons: string[] = [];
    let riskScore = 0;

    if (isNewDevice) {
      riskScore += 30;
      reasons.push("NEW_DEVICE_LOGIN");

      // Save the new device
      userDevices.set(deviceHash, {
        deviceHash,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        lastIp: signals.ip,
      });
    } else {
      // Known device: update timestamp
      existingDevice.lastSeenAt = new Date();
      if (existingDevice.lastIp !== signals.ip) {
        riskScore += 15;
        reasons.push("IP_ADDRESS_CHANGED");
        existingDevice.lastIp = signals.ip;
      }
    }

    // Check failed login history for account-based escalation
    if (user.failedLoginAttempts >= 3) {
      riskScore += 40;
      reasons.push("RECENT_FAILED_ATTEMPTS_DETECTED");
    }

    const isSuspicious = riskScore >= 50;

    if (isNewDevice || isSuspicious) {
      await this.auditLogger.log({
        actorType: "USER",
        actorId: user.id,
        action: isSuspicious ? "SUSPICIOUS_LOGIN_DETECTED" : "NEW_DEVICE_LOGIN",
        ipAddress: signals.ip,
        userAgent: signals.userAgent,
        metadata: {
          riskScore,
          reasons,
          deviceHash,
        },
      });
    }

    return {
      isSuspicious,
      isNewDevice,
      riskScore,
      reasons,
    };
  }
}
