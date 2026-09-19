import { randomBytes } from "node:crypto";

export type IdPrefix =
  | "usr"
  | "org"
  | "tenant"
  | "tx"
  | "evt"
  | "job"
  | "inv"
  | "sub"
  | "key"
  | "sec"
  | "req"
  | "trace";

// Crockford's Base32 alphabet for human-friendly sortable strings
const ENCODING_CHARS = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Generates a ULID-compatible time-ordered, enumeration-resistant sortable ID.
 * First 48 bits: Unix timestamp in milliseconds
 * Remaining 80 bits: Cryptographically secure random bytes
 */
export function generateSortableId(): string {
  const now = Date.now();
  let timePart = "";
  let tempTime = now;

  for (let i = 9; i >= 0; i--) {
    timePart = ENCODING_CHARS[tempTime % 32] + timePart;
    tempTime = Math.floor(tempTime / 32);
  }

  const randomPartBytes = randomBytes(10);
  let randomPart = "";
  for (let i = 0; i < 16; i++) {
    const byte = randomPartBytes[i % 10];
    randomPart += ENCODING_CHARS[byte % 32];
  }

  return `${timePart}${randomPart}`;
}

/**
 * Generates a prefixed public ID (e.g., usr_01H9Z..., org_01H9Z...).
 * Combines domain clarity with sorting, index locality, and enumeration resistance.
 */
export function generatePrefixedId(prefix: IdPrefix | string): string {
  return `${prefix}_${generateSortableId()}`;
}

/**
 * Generates a cryptographically secure random token (e.g., API keys, bypass tokens).
 */
export function generateSecureToken(prefix?: string, lengthBytes: number = 32): string {
  const token = randomBytes(lengthBytes).toString("hex");
  return prefix ? `${prefix}_${token}` : token;
}

/**
 * Validates whether an ID matches the expected format and optional prefix.
 */
export function isValidPrefixedId(id: string, expectedPrefix?: IdPrefix | string): boolean {
  if (!id || typeof id !== "string") return false;
  const parts = id.split("_");
  if (parts.length !== 2) return false;
  const [prefix, suffix] = parts;
  if (expectedPrefix && prefix !== expectedPrefix) return false;
  if (suffix.length !== 26) return false;
  for (const char of suffix) {
    if (!ENCODING_CHARS.includes(char)) return false;
  }
  return true;
}

/**
 * Extracts timestamp in milliseconds from a sortable ID.
 */
export function extractTimestampFromId(id: string): number {
  const suffix = id.includes("_") ? id.split("_")[1] : id;
  if (suffix.length < 10) throw new Error(`Invalid sortable ID: ${id}`);
  const timeStr = suffix.slice(0, 10);
  let timestamp = 0;
  for (let i = 0; i < 10; i++) {
    const charIndex = ENCODING_CHARS.indexOf(timeStr[i]);
    if (charIndex === -1) throw new Error(`Invalid character in ID: ${timeStr[i]}`);
    timestamp = timestamp * 32 + charIndex;
  }
  return timestamp;
}
