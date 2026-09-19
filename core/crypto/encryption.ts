import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { InternalError } from "../errors/errors.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

export interface KeyRing {
  activeVersion: string;
  keys: Record<string, string>; // version -> 32-byte hex/base64 encoded key
}

/**
 * Validates and retrieves a 32-byte key buffer for a given version.
 */
function getKeyBuffer(keyRing: KeyRing, version: string): Buffer {
  const rawKey = keyRing.keys[version];
  if (!rawKey) {
    throw new InternalError(`Encryption key version '${version}' not found in KeyRing`);
  }

  const buf = Buffer.from(rawKey, "hex");
  if (buf.length !== 32) {
    throw new InternalError(`Key version '${version}' must be exactly 32 bytes (256 bits)`);
  }
  return buf;
}

/**
 * Encrypts a plaintext string using AES-256-GCM and the active key version.
 * Output format: `enc:version:iv_hex:tag_hex:ciphertext_hex`
 */
export function encryptField(plainText: string, keyRing: KeyRing): string {
  const version = keyRing.activeVersion;
  const key = getKeyBuffer(keyRing, version);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return `enc:${version}:${iv.toString("hex")}:${tag}:${encrypted}`;
}

/**
 * Decrypts a formatted ciphertext string using the matching key version.
 */
export function decryptField(cipherText: string, keyRing: KeyRing): string {
  if (!isEncryptedField(cipherText)) {
    throw new InternalError("Value is not a valid encrypted field string");
  }

  const [, version, ivHex, tagHex, encryptedHex] = cipherText.split(":");
  const key = getKeyBuffer(keyRing, version);
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Rotates an encrypted field to the latest active key version if needed.
 */
export function reEncryptField(cipherText: string, keyRing: KeyRing): {
  rotated: boolean;
  newCipherText: string;
} {
  if (!isEncryptedField(cipherText)) {
    throw new InternalError("Value is not a valid encrypted field string");
  }

  const [, version] = cipherText.split(":");
  if (version === keyRing.activeVersion) {
    return { rotated: false, newCipherText: cipherText };
  }

  const plain = decryptField(cipherText, keyRing);
  const newCipherText = encryptField(plain, keyRing);
  return { rotated: true, newCipherText };
}

/**
 * Checks if a string conforms to the encrypted field format.
 */
export function isEncryptedField(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parts = value.split(":");
  return parts.length === 5 && parts[0] === "enc";
}
