export const alphaAuthCookieName = 'pkg_alpha_auth';

const cookieMaxAgeSeconds = 60 * 60 * 24 * 365;

export type AlphaAuthResolution =
  | {
      status: 'authenticated';
      email: string;
      setCookieHeader?: string;
    }
  | {
      status: 'anonymous';
    }
  | {
      status: 'unauthorized';
      message: string;
    };

export type AlphaAuthRequest = {
  authorizationHeader?: string | string[];
  accessTokenHeader?: string | string[];
  cookieHeader?: string | string[];
};

type AlphaAuthConfig = {
  authEnabled: boolean;
  anonymousWorkspaceEnabled: boolean;
  tokensByValue: Map<string, string>;
};

export function resolveAlphaAuth(
  request: AlphaAuthRequest,
  env: NodeJS.ProcessEnv = process.env,
): AlphaAuthResolution {
  const config = getAlphaAuthConfig(env);

  if (!config.authEnabled) {
    return { status: 'anonymous' };
  }

  const token = getRequestAccessToken(request);

  if (token) {
    const email = config.tokensByValue.get(token);

    if (email) {
      return {
        status: 'authenticated',
        email,
        setCookieHeader: createAuthCookie(token),
      };
    }

    return {
      status: 'unauthorized',
      message: 'Alpha access token is not valid.',
    };
  }

  if (config.anonymousWorkspaceEnabled) {
    return { status: 'anonymous' };
  }

  return {
    status: 'unauthorized',
    message: 'Alpha access is required for hosted graph persistence.',
  };
}

function getAlphaAuthConfig(env: NodeJS.ProcessEnv): AlphaAuthConfig {
  return {
    authEnabled: env.ALPHA_AUTH_ENABLED === 'true',
    anonymousWorkspaceEnabled: env.ALPHA_ANONYMOUS_WORKSPACE_ENABLED !== 'false',
    tokensByValue: parseConfiguredTokens(env),
  };
}

function parseConfiguredTokens(env: NodeJS.ProcessEnv): Map<string, string> {
  const tokensByValue = new Map<string, string>();
  const singleToken = env.ALPHA_ACCESS_TOKEN?.trim();
  const singleEmail = normaliseEmail(env.ALPHA_USER_EMAIL ?? '');

  if (singleToken && singleEmail) {
    tokensByValue.set(singleToken, singleEmail);
  }

  env.ALPHA_AUTH_TOKENS?.split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const separatorIndex = entry.indexOf(':');

      if (separatorIndex < 1) {
        return;
      }

      const token = entry.slice(0, separatorIndex).trim();
      const email = normaliseEmail(entry.slice(separatorIndex + 1));

      if (token && email) {
        tokensByValue.set(token, email);
      }
    });

  return tokensByValue;
}

function getRequestAccessToken(request: AlphaAuthRequest): string | undefined {
  return (
    getBearerToken(request.authorizationHeader) ??
    getFirstHeaderValue(request.accessTokenHeader)?.trim() ??
    decodeCookieValue(getCookieValue(request.cookieHeader, alphaAuthCookieName))
  );
}

function getBearerToken(header: string | string[] | undefined): string | undefined {
  const value = getFirstHeaderValue(header);

  if (!value?.toLowerCase().startsWith('bearer ')) {
    return undefined;
  }

  return value.slice('bearer '.length).trim() || undefined;
}

function getFirstHeaderValue(
  header: string | string[] | undefined,
): string | undefined {
  return Array.isArray(header) ? header[0] : header;
}

function getCookieValue(
  cookieHeader: string | string[] | undefined,
  name: string,
): string | undefined {
  const header = Array.isArray(cookieHeader)
    ? cookieHeader.join('; ')
    : cookieHeader;

  return header
    ?.split(';')
    .map((cookie) => cookie.trim())
    .map((cookie) => {
      const [cookieName, ...valueParts] = cookie.split('=');

      return {
        name: cookieName,
        value: valueParts.join('='),
      };
    })
    .find((cookie) => cookie.name === name && cookie.value.length > 0)?.value;
}

function createAuthCookie(token: string): string {
  return `${alphaAuthCookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${cookieMaxAgeSeconds}`;
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function decodeCookieValue(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
