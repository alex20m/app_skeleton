/**
 * The authentication seam.
 *
 * Deliberately an interface with a not-configured default rather than a wired
 * provider. The house default is Neon Auth (managed Better Auth), but its SDK
 * is young and its package, variable and component names have changed before —
 * see the `cli-first-provisioning` skill. Guessing that surface here would ship
 * code that builds and fails at sign-in, which is the worst of both.
 *
 * So the skeleton fixes the *shape* — what the rest of the app is allowed to
 * assume about a session — and INIT.md tells whoever sets the project up to
 * implement `AuthProvider` against whatever the provider's own README says
 * today. Everything downstream (route handlers, tests) is written against this
 * interface, so plugging the real one in touches exactly one file.
 */

export type Session = {
  /** Stable identifier for the account. Never an email — those change. */
  userId: string;
  email: string;
};

export interface AuthProvider {
  /**
   * The session for this request, or null when the caller is anonymous.
   *
   * Takes the Request rather than reading cookies globally so it is callable
   * from route handlers, middleware and tests alike without a request-scoped
   * global.
   */
  getSession(request: Request): Promise<Session | null>;
}

/**
 * What an unconfigured project gets: everyone is anonymous. It fails closed —
 * routes deny rather than admit — so a half-finished setup cannot accidentally
 * expose data.
 */
export const unconfiguredAuth: AuthProvider = {
  getSession: async () => null,
};

let provider: AuthProvider = unconfiguredAuth;

export function authProvider(): AuthProvider {
  return provider;
}

/** Called once at startup by the real provider, and by tests. */
export function setAuthProvider(next: AuthProvider): void {
  provider = next;
}

/** Convenience for route handlers: `const session = await sessionFor(request);` */
export async function sessionFor(request: Request): Promise<Session | null> {
  return provider.getSession(request);
}
