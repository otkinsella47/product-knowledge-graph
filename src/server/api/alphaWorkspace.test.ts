import { describe, expect, it } from 'vitest';
import {
  alphaWorkspaceCookieName,
  resolveAlphaWorkspace,
} from './alphaWorkspace';

describe('alpha workspace resolution', () => {
  it('reuses an existing alpha workspace cookie', () => {
    expect(
      resolveAlphaWorkspace(
        `other=value; ${alphaWorkspaceCookieName}=alpha-existing-workspace`,
      ),
    ).toEqual({
      workspaceId: 'alpha-existing-workspace',
    });
  });

  it('creates a new anonymous alpha workspace cookie when missing', () => {
    const resolution = resolveAlphaWorkspace(undefined);

    expect(resolution.workspaceId).toMatch(/^alpha-/);
    expect(resolution.setCookieHeader).toContain(
      `${alphaWorkspaceCookieName}=${resolution.workspaceId}`,
    );
    expect(resolution.setCookieHeader).toContain('HttpOnly');
    expect(resolution.setCookieHeader).toContain('SameSite=Lax');
  });
});
