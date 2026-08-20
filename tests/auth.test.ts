import { afterEach, describe, expect, it } from 'vitest';
import { GET } from '@/app/api/me/route';
import { setAuthProvider, unconfiguredAuth, type Session } from '@/lib/auth';

afterEach(() => {
  setAuthProvider(unconfiguredAuth);
});

function request(): Request {
  return new Request('https://example.test/api/me');
}

function providerReturning(session: Session | null) {
  return { getSession: async () => session };
}

describe('an authenticated route', () => {
  it('refuses an anonymous request', async () => {
    // The default provider fails closed, so a project that has not wired auth
    // yet denies rather than exposing the route.
    const response = await GET(request());

    expect(response.status).toBe(401);
  });

  it('tells an anonymous caller nothing about any account', async () => {
    const body = await (await GET(request())).text();

    expect(body).not.toContain('@');
  });

  it('answers with the signed-in account', async () => {
    setAuthProvider(providerReturning({ userId: 'user_123', email: 'someone@example.test' }));

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      userId: 'user_123',
      email: 'someone@example.test',
    });
  });
});
