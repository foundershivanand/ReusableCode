import {
  LoginInput,
  OAuthProvider,
  PublicUser,
  SignupInput,
} from "../schemas/auth-schemas.js";
import { SessionRecord } from "../server/repository.js";

export interface AuthSessionResult {
  user: PublicUser;
  session?: SessionRecord;
  rawToken?: string;
  requiresMFA?: boolean;
  mfaSessionToken?: string;
}

export interface AuthProviderAdapter {
  readonly name: string;

  signUp(params: SignupInput, metadata?: { ip?: string; userAgent?: string }): Promise<AuthSessionResult>;

  signInWithPassword(
    params: LoginInput,
    metadata?: { ip?: string; userAgent?: string }
  ): Promise<AuthSessionResult>;

  signInWithMagicLink(
    email: string,
    metadata?: { ip?: string; userAgent?: string }
  ): Promise<{ message: string }>;

  getOAuthAuthorizationUrl(
    provider: OAuthProvider,
    redirectUri: string
  ): Promise<{ url: string; state: string }>;

  handleOAuthCallback(
    provider: OAuthProvider,
    code: string,
    state: string
  ): Promise<AuthSessionResult>;

  signOut(sessionId: string, userId: string): Promise<void>;

  signOutAll(userId: string): Promise<void>;

  requestPasswordReset(
    email: string,
    metadata?: { ip?: string; userAgent?: string }
  ): Promise<{ message: string }>;

  getUser(userId: string): Promise<PublicUser | null>;

  validateSessionToken(token: string): Promise<{ session: SessionRecord; user: PublicUser } | null>;
}
