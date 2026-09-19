import { describe, expect, it } from "vitest";
import { CSRFMiddleware } from "../middleware/csrf-middleware.js";

describe("CSRF Protection", () => {
  it("allows safe HTTP methods (GET, HEAD, OPTIONS) without CSRF token", () => {
    const csrf = new CSRFMiddleware();

    expect(csrf.validateRequest({ method: "GET", headers: {} })).toBe(true);
    expect(csrf.validateRequest({ method: "HEAD", headers: {} })).toBe(true);
    expect(csrf.validateRequest({ method: "OPTIONS", headers: {} })).toBe(true);
  });

  it("requires matching CSRF cookie and header on state-changing methods (POST, PUT, DELETE)", () => {
    const csrf = new CSRFMiddleware({
      cookieName: "__Host-csrf_token",
      headerName: "x-csrf-token",
    });

    const token = csrf.generateToken();

    // Valid matching token
    const validReq = {
      method: "POST",
      headers: { "x-csrf-token": token },
      cookies: { "__Host-csrf_token": token },
    };
    expect(csrf.validateRequest(validReq)).toBe(true);

    // Mismatched token
    const invalidReq = {
      method: "POST",
      headers: { "x-csrf-token": token },
      cookies: { "__Host-csrf_token": "different-token" },
    };
    expect(csrf.validateRequest(invalidReq)).toBe(false);

    // Missing header
    const missingHeader = {
      method: "POST",
      headers: {},
      cookies: { "__Host-csrf_token": token },
    };
    expect(csrf.validateRequest(missingHeader)).toBe(false);

    // Missing cookie
    const missingCookie = {
      method: "POST",
      headers: { "x-csrf-token": token },
      cookies: {},
    };
    expect(csrf.validateRequest(missingCookie)).toBe(false);
  });
});
