import crypto from "node:crypto";

/**
 * Base32 Alphabet (RFC 4648)
 */
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) {
      throw new Error(`Invalid Base32 character: ${cleaned[i]}`);
    }
    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export interface TOTPVerifyResult {
  valid: boolean;
  step?: number;
  error?: string;
}

export interface MFASetupResult {
  secret: string; // Base32
  otpauthUrl: string;
  recoveryCodes: string[]; // Plaintext for user to save
  hashedRecoveryCodes: string[]; // Hashes for database storage
}

export class MFAService {
  private stepSeconds: number = 30;
  private digits: number = 6;
  private maxFailedAttempts: number = 5;

  getMaxFailedAttempts(): number {
    return this.maxFailedAttempts;
  }

  /**
   * Generates a new TOTP secret, recovery codes, and OTPAuth URL
   */
  generateSetup(email: string, issuer: string = "ReusableApp"): MFASetupResult {
    // 20 bytes = 160 bits (RFC recommended)
    const secretBuffer = crypto.randomBytes(20);
    const secret = base32Encode(secretBuffer);

    const encodedIssuer = encodeURIComponent(issuer);
    const encodedEmail = encodeURIComponent(email);
    const otpauthUrl = `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${this.digits}&period=${this.stepSeconds}`;

    const recoveryCodes = this.generateRecoveryCodes(10);
    const hashedRecoveryCodes = recoveryCodes.map((code) => this.hashRecoveryCode(code));

    return {
      secret,
      otpauthUrl,
      recoveryCodes,
      hashedRecoveryCodes,
    };
  }

  /**
   * Generates cryptographically secure alphanumeric recovery codes
   */
  generateRecoveryCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // 10 chars, formatted as XXXX-XXXX
      const raw = crypto.randomBytes(5).toString("hex").toUpperCase();
      const formatted = `${raw.slice(0, 5)}-${raw.slice(5, 10)}`;
      codes.push(formatted);
    }
    return codes;
  }

  /**
   * Hashes recovery code with SHA-256 for secure database storage
   */
  hashRecoveryCode(code: string): string {
    const normalized = code.replace(/[-\s]/g, "").toUpperCase();
    return crypto.createHash("sha256").update(normalized).digest("hex");
  }

  /**
   * Verifies a recovery code against stored hashes
   */
  verifyRecoveryCode(
    providedCode: string,
    storedHashes: string[]
  ): { valid: boolean; matchingHash?: string } {
    const inputHash = this.hashRecoveryCode(providedCode);
    const inputBuffer = Buffer.from(inputHash, "hex");

    for (const hash of storedHashes) {
      const storedBuffer = Buffer.from(hash, "hex");
      if (
        inputBuffer.length === storedBuffer.length &&
        crypto.timingSafeEqual(inputBuffer, storedBuffer)
      ) {
        return { valid: true, matchingHash: hash };
      }
    }

    return { valid: false };
  }

  /**
   * Computes TOTP code for a given timestamp step
   */
  private computeHOTP(key: Buffer, step: number): string {
    const counterBuffer = Buffer.alloc(8);
    // Write 64-bit integer big-endian
    counterBuffer.writeBigInt64BE(BigInt(step), 0);

    const hmac = crypto.createHmac("sha1", key).update(counterBuffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = binary % 10 ** this.digits;
    return otp.toString().padStart(this.digits, "0");
  }

  /**
   * Verifies TOTP code with:
   * - Clock drift handling (window: step - 1, step, step + 1)
   * - Replay prevention (verifies step > lastUsedStep)
   */
  verifyTOTP(
    secret: string,
    code: string,
    lastUsedStep: number = 0,
    currentTimeMs: number = Date.now()
  ): TOTPVerifyResult {
    try {
      const key = base32Decode(secret);
      const currentStep = Math.floor(currentTimeMs / 1000 / this.stepSeconds);

      // Window check: -1, 0, +1
      const driftSteps = [-1, 0, 1];

      for (const drift of driftSteps) {
        const step = currentStep + drift;
        // Replay prevention: reject if this step was already consumed
        if (step <= lastUsedStep) {
          continue;
        }

        const expectedCode = this.computeHOTP(key, step);
        const codeBuf = Buffer.from(code.trim());
        const expBuf = Buffer.from(expectedCode);

        if (codeBuf.length === expBuf.length && crypto.timingSafeEqual(codeBuf, expBuf)) {
          return { valid: true, step };
        }
      }

      return { valid: false, error: "Invalid or expired MFA code" };
    } catch {
      return { valid: false, error: "Failed to verify MFA code" };
    }
  }

  /**
   * Helper to generate a code for testing/verification
   */
  generateTOTP(secret: string, timeMs: number = Date.now()): string {
    const key = base32Decode(secret);
    const step = Math.floor(timeMs / 1000 / this.stepSeconds);
    return this.computeHOTP(key, step);
  }
}
