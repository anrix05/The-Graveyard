import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser } from '@/lib/supabase';
import { validateRepositoryAdmin, fetchRepositoryFileTree } from '@/lib/github';

const validateRepoSchema = z.object({
  repoFullName: z.string().min(1, 'Repository identifier is required.'),
});

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: authError || 'Authentication required' } }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = validateRepoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || 'Invalid parameters.' } },
        { status: 400 }
      );
    }

    const { repoFullName } = parsed.data;
    const result = await validateRepositoryAdmin(repoFullName);

    if (!result.valid) {
      return NextResponse.json(
        { error: { code: 'REPO_VALIDATION_FAILED', message: result.error || 'Failed to validate repository.' } },
        { status: 400 }
      );
    }

    const cleanName = repoFullName.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
    const fileTree = await fetchRepositoryFileTree(cleanName);

    return NextResponse.json({
      valid: true,
      isPrivate: result.isPrivate,
      id: result.id,
      lastCommitAt: result.pushedAt,
      repoFullName: cleanName,
      fileTree,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 });
  }
}
