const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN;

/**
 * Validates whether a GitHub username exists.
 */
export async function validateGitHubUser(username: string): Promise<{ exists: boolean; error?: string }> {
  if (!username || username.trim() === '') {
    return { exists: false, error: 'GitHub username is required.' };
  }

  const cleanUser = username.trim().replace(/^@/, '');

  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
    }

    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUser)}`, {
      method: 'GET',
      headers,
    });

    if (res.status === 200) {
      return { exists: true };
    } else if (res.status === 404) {
      return { exists: false, error: `GitHub user "${cleanUser}" does not exist.` };
    } else {
      return { exists: false, error: `GitHub API returned status ${res.status}.` };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { exists: false, error: `Failed to contact GitHub: ${message}` };
  }
}

/**
 * Validates whether the platform PAT has admin access to manage collaborators for a given repo.
 */
export async function validateRepositoryAdmin(
  repoFullName: string
): Promise<{ valid: boolean; isPrivate?: boolean; id?: string; error?: string; pushedAt?: string | null }> {
  if (!GITHUB_TOKEN) {
    return {
      valid: false,
      error: 'Platform GITHUB_ACCESS_TOKEN is missing in server environment.',
    };
  }

  const cleanRepo = repoFullName.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
  const parts = cleanRepo.split('/');
  if (parts.length !== 2) {
    return {
      valid: false,
      error: 'Invalid repository format. Please provide "owner/repo" or a valid GitHub URL.',
    };
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${cleanRepo}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (res.status === 404) {
      return {
        valid: false,
        error: `Repository "${cleanRepo}" not found or private without token access.`,
      };
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        valid: false,
        error: (err as { message?: string }).message || `GitHub error ${res.status}`,
      };
    }

    const data = await res.json();
    const permissions = data.permissions || {};

    if (!permissions.admin) {
      return {
        valid: false,
        isPrivate: data.private,
        id: String(data.id),
        error:
          'The demo GitHub token cannot manage this repo. Use one of your own repos in the demo account/org or grant admin permissions.',
      };
    }

    return {
      valid: true,
      isPrivate: Boolean(data.private),
      id: String(data.id),
      pushedAt: data.pushed_at || null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { valid: false, error: `Failed to verify repository: ${message}` };
  }
}

/**
 * Invites a GitHub user to a repository as a collaborator.
 */
export async function inviteCollaborator(
  repoFullName: string,
  username: string,
  permission: 'pull' | 'push' = 'pull'
): Promise<{ success: boolean; message: string }> {
  if (!GITHUB_TOKEN) {
    console.error('GITHUB_ACCESS_TOKEN is missing in environment variables.');
    return { success: false, message: 'Server configuration error: Missing GitHub Token.' };
  }

  const cleanRepo = repoFullName.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
  const cleanUser = username.trim().replace(/^@/, '');

  try {
    const response = await fetch(
      `https://api.github.com/repos/${cleanRepo}/collaborators/${encodeURIComponent(cleanUser)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({ permission }),
      }
    );

    if (response.ok) {
      // 201 Created or 204 No Content (already invited/collaborator)
      return { success: true, message: 'Invitation sent successfully.' };
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('GitHub API Error:', errorData);
      return {
        success: false,
        message: (errorData as { message?: string }).message || 'Failed to invite user.',
      };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Network error';
    console.error('GitHub Invitation Exception:', error);
    return { success: false, message };
  }
}

/**
 * Fetches repository file tree via GitHub Trees API recursively.
 * Excludes sensitive files (.env*), dependencies (node_modules/), git metadata (.git/),
 * and returns up to 300 clean file paths.
 */
export async function fetchRepositoryFileTree(repoFullName: string): Promise<string[]> {
  if (!GITHUB_TOKEN) return [];

  const cleanRepo = repoFullName.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');

  try {
    const res = await fetch(`https://api.github.com/repos/${cleanRepo}/git/trees/HEAD?recursive=1`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const tree = data.tree || [];

    const excludedPatterns = [
      /^\.env/i,
      /^node_modules[/\\]/i,
      /^\.git[/\\]/i,
      /\/\.env/i,
      /\/node_modules\//i,
      /\/\.git\//i,
      /\.DS_Store$/i,
    ];

    const validPaths: string[] = [];
    for (const item of tree) {
      if (item.type !== 'blob') continue; // Files only
      const p = item.path;
      if (!p) continue;

      const isExcluded = excludedPatterns.some((pattern) => pattern.test(p));
      if (!isExcluded) {
        validPaths.push(p);
      }
      if (validPaths.length >= 300) break;
    }

    return validPaths;
  } catch (err) {
    console.error('Failed to fetch repo file tree:', err);
    return [];
  }
}

