import { SessionService } from "../server/session-service.js";
import { SessionRecord, UserRecord } from "../server/repository.js";
import { CookieManager } from "../server/cookie-manager.js";

export interface AuthContext {
  session: SessionRecord;
  user: UserRecord;
}

export class AuthMiddleware {
  private sessionService: SessionService;
  private cookieManager: CookieManager;

  constructor(sessionService: SessionService, cookieManager?: CookieManager) {
    this.sessionService = sessionService;
    this.cookieManager = cookieManager || new CookieManager();
  }

  /**
   * Authenticates incoming request from Cookie or Authorization header
   */
  async authenticate(req: {
    headers: Record<string, string | string[] | undefined>;
    cookies?: Record<string, string>;
  }): Promise<AuthContext | null> {
    let token: string | null = null;

    // 1. Try Authorization header
    const authHeader = req.headers["authorization"];
    const authStr = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    if (authStr && authStr.startsWith("Bearer ")) {
      token = authStr.substring(7).trim();
    }

    // 2. Try Cookie
    if (!token) {
      const cookieHeader = req.headers["cookie"];
      const cookieStr = Array.isArray(cookieHeader) ? cookieHeader[0] : cookieHeader;
      token = this.cookieManager.getSessionToken(cookieStr) || req.cookies?.["__Host-auth_session"] || null;
    }

    if (!token) {
      return null;
    }

    return this.sessionService.validateSession(token);
  }
}
