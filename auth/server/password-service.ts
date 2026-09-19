import crypto from "node:crypto";

function scryptAsync(
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: crypto.ScryptOptions
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
}

export interface PasswordHasherConfig {
  cost: number; // N (CPU/memory cost parameter)
  blockSize: number; // r
  parallelization: number; // p
  keyLength: number;
  saltLength: number;
}

export const DEFAULT_PASSWORD_CONFIG: PasswordHasherConfig = {
  cost: 32768, // N = 2^15
  blockSize: 8, // r
  parallelization: 1, // p
  keyLength: 64,
  saltLength: 32,
};

export interface PasswordBreachChecker {
  isBreached(password: string): Promise<boolean>;
}

/**
 * Mock / In-Memory breach checker for tests and pluggable implementations
 */
export class InMemoryBreachChecker implements PasswordBreachChecker {
  private breachedHashes: Set<string> = new Set();

  constructor(knownBreachedPasswords: string[] = ["Password123!", "Admin12345!", "P@ssword123!"]) {
    for (const pwd of knownBreachedPasswords) {
      const sha1 = crypto.createHash("sha1").update(pwd).digest("hex").toUpperCase();
      this.breachedHashes.add(sha1);
    }
  }

  async isBreached(password: string): Promise<boolean> {
    const sha1 = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
    return this.breachedHashes.has(sha1);
  }

  addBreachedPassword(password: string): void {
    const sha1 = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
    this.breachedHashes.add(sha1);
  }
}

export class PasswordService {
  private config: PasswordHasherConfig;
  private breachChecker?: PasswordBreachChecker;

  constructor(
    config: Partial<PasswordHasherConfig> = {},
    breachChecker?: PasswordBreachChecker
  ) {
    this.config = { ...DEFAULT_PASSWORD_CONFIG, ...config };
    this.breachChecker = breachChecker;
  }

  /**
   * Hashes a password using scrypt with cryptographically random salt
   * Format: $scrypt$v=1$N=<cost>,r=<blockSize>,p=<parallelization>$<salt-hex>$<hash-hex>
   */
  async hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(this.config.saltLength);
    const derivedKey = (await scryptAsync(password, salt, this.config.keyLength, {
      N: this.config.cost,
      r: this.config.blockSize,
      p: this.config.parallelization,
      maxmem: 128 * 1024 * 1024,
    })) as Buffer;

    return `$scrypt$v=1$N=${this.config.cost},r=${this.config.blockSize},p=${this.config.parallelization}$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
  }

  /**
   * Verifies password against hash using timing-safe comparison
   */
  async verifyPassword(password: string, serializedHash: string): Promise<boolean> {
    try {
      const parts = serializedHash.split("$");
      if (parts.length !== 6 || parts[1] !== "scrypt" || parts[2] !== "v=1") {
        return false;
      }

      const params = parts[3].split(",");
      const costParam = params.find((p) => p.startsWith("N="));
      const rParam = params.find((p) => p.startsWith("r="));
      const pParam = params.find((p) => p.startsWith("p="));

      if (!costParam || !rParam || !pParam) return false;

      const N = parseInt(costParam.substring(2), 10);
      const r = parseInt(rParam.substring(2), 10);
      const p = parseInt(pParam.substring(2), 10);

      const salt = Buffer.from(parts[4], "hex");
      const expectedHash = Buffer.from(parts[5], "hex");

      const derivedKey = (await scryptAsync(password, salt, expectedHash.length, {
        N,
        r,
        p,
        maxmem: 128 * 1024 * 1024,
      })) as Buffer;

      if (derivedKey.length !== expectedHash.length) {
        return false;
      }

      return crypto.timingSafeEqual(derivedKey, expectedHash);
    } catch {
      return false;
    }
  }

  /**
   * Checks whether the stored hash needs rehashing (due to upgraded cost parameters)
   */
  needsRehash(serializedHash: string): boolean {
    try {
      const parts = serializedHash.split("$");
      if (parts.length !== 6) return true;
      const params = parts[3].split(",");
      const costParam = params.find((p) => p.startsWith("N="));
      const rParam = params.find((p) => p.startsWith("r="));
      const pParam = params.find((p) => p.startsWith("p="));

      const N = costParam ? parseInt(costParam.substring(2), 10) : 0;
      const r = rParam ? parseInt(rParam.substring(2), 10) : 0;
      const p = pParam ? parseInt(pParam.substring(2), 10) : 0;

      return (
        N < this.config.cost ||
        r < this.config.blockSize ||
        p < this.config.parallelization
      );
    } catch {
      return true;
    }
  }

  /**
   * Performs a constant-time dummy verification when user is not found
   * to protect against timing-based account enumeration attacks.
   */
  async dummyVerification(): Promise<void> {
    const dummyHash =
      "$scrypt$v=1$N=32768,r=8,p=1$0000000000000000000000000000000000000000000000000000000000000000$00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    await this.verifyPassword("dummy-password-check", dummyHash);
  }

  /**
   * Checks if password was recently used in password history
   */
  async isPasswordReused(newPassword: string, previousHashes: string[]): Promise<boolean> {
    for (const oldHash of previousHashes) {
      if (await this.verifyPassword(newPassword, oldHash)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if password has been compromised in known data breaches
   */
  async isPasswordBreached(password: string): Promise<boolean> {
    if (!this.breachChecker) {
      return false;
    }
    return this.breachChecker.isBreached(password);
  }
}
