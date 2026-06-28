import { describe, expect, it } from 'vitest';
import {
  alphaAuthCookieName,
  resolveAlphaAuth,
} from './alphaAuth';

describe('alpha auth resolution', () => {
  it('uses anonymous workspace fallback when alpha auth is disabled', () => {
    expect(resolveAlphaAuth({}, {})).toEqual({
      status: 'anonymous',
    });
  });

  it('authenticates a configured alpha access token from a request header', () => {
    expect(
      resolveAlphaAuth(
        {
          accessTokenHeader: 'alpha-token',
        },
        {
          ALPHA_AUTH_ENABLED: 'true',
          ALPHA_AUTH_TOKENS: 'alpha-token:Alpha@Example.com',
        },
      ),
    ).toMatchObject({
      status: 'authenticated',
      email: 'alpha@example.com',
      setCookieHeader: expect.stringContaining(
        `${alphaAuthCookieName}=alpha-token`,
      ),
    });
  });

  it('authenticates a configured alpha access token from an auth cookie', () => {
    expect(
      resolveAlphaAuth(
        {
          cookieHeader: `${alphaAuthCookieName}=alpha-token`,
        },
        {
          ALPHA_AUTH_ENABLED: 'true',
          ALPHA_ACCESS_TOKEN: 'alpha-token',
          ALPHA_USER_EMAIL: 'alpha@example.com',
        },
      ),
    ).toMatchObject({
      status: 'authenticated',
      email: 'alpha@example.com',
    });
  });

  it('rejects missing auth when anonymous fallback is disabled', () => {
    expect(
      resolveAlphaAuth(
        {},
        {
          ALPHA_AUTH_ENABLED: 'true',
          ALPHA_ANONYMOUS_WORKSPACE_ENABLED: 'false',
        },
      ),
    ).toEqual({
      status: 'unauthorized',
      message: 'Alpha access is required for hosted graph persistence.',
    });
  });
});
