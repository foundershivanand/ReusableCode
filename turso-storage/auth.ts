import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { getConfig } from "./config.ts";

const TOKEN_SECRET = process.env.AUTH_SECRET || "turso-storage-secret-key-salt";

export interface AuthContext {
  authenticated: boolean;
  username?: string;
}

export function verifyCredentials(user?: string, pass?: string): boolean {
  const config = getConfig();
  if (!user || !pass) return false;

  const expectedUser = Buffer.from(config.adminUsername);
  const expectedPass = Buffer.from(config.adminPassword);
  const actualUser = Buffer.from(user);
  const actualPass = Buffer.from(pass);

  if (actualUser.length !== expectedUser.length || actualPass.length !== expectedPass.length) {
    return false;
  }

  return (
    timingSafeEqual(actualUser, expectedUser) &&
    timingSafeEqual(actualPass, expectedPass)
  );
}

export function generateToken(username: string): string {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = `${username}:${expiresAt}`;
  const signature = createHmac("sha256", TOKEN_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function verifyToken(token: string): AuthContext {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length !== 3) return { authenticated: false };

    const [username, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (Date.now() > expiresAt) {
      return { authenticated: false };
    }

    const payload = `${username}:${expiresAtStr}`;
    const expectedSig = createHmac("sha256", TOKEN_SECRET).update(payload).digest("hex");

    if (signature === expectedSig) {
      return { authenticated: true, username };
    }
  } catch {
    return { authenticated: false };
  }

  return { authenticated: false };
}

export function authenticateRequest(req: IncomingMessage): AuthContext {
  // 1. Check Bearer token in Authorization header
  const authHeader = req.headers["authorization"];
  if (authHeader) {
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      const verified = verifyToken(token);
      if (verified.authenticated) return verified;
    }

    // 2. Check Basic auth header: "Basic base64(user:pass)"
    if (authHeader.startsWith("Basic ")) {
      try {
        const credentials = Buffer.from(authHeader.slice(6).trim(), "base64").toString("utf-8");
        const [u, p] = credentials.split(":");
        if (verifyCredentials(u, p)) {
          return { authenticated: true, username: u };
        }
      } catch {
        // ignore malformed base64
      }
    }
  }

  // 3. Check Cookie header: "auth_token=..."
  const cookieHeader = req.headers["cookie"];
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith("auth_token=")) {
        const token = cookie.slice("auth_token=".length);
        const verified = verifyToken(token);
        if (verified.authenticated) return verified;
      }
    }
  }

  return { authenticated: false };
}
