import { randomUUID } from 'node:crypto';

export const alphaWorkspaceCookieName = 'pkg_alpha_workspace';

const cookieMaxAgeSeconds = 60 * 60 * 24 * 365;

export type AlphaWorkspaceResolution = {
  workspaceId: string;
  setCookieHeader?: string;
};

export function resolveAlphaWorkspace(
  cookieHeader: string | string[] | undefined,
): AlphaWorkspaceResolution {
  const workspaceId = getCookieValue(cookieHeader, alphaWorkspaceCookieName);

  if (workspaceId) {
    return { workspaceId };
  }

  const nextWorkspaceId = `alpha-${randomUUID()}`;

  return {
    workspaceId: nextWorkspaceId,
    setCookieHeader: createWorkspaceCookie(nextWorkspaceId),
  };
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

function createWorkspaceCookie(workspaceId: string): string {
  return `${alphaWorkspaceCookieName}=${workspaceId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${cookieMaxAgeSeconds}`;
}
