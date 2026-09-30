import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/supabase';

const projectAccessSchema = z.object({
  projectId: z.string().uuid('Invalid project ID format.'),
});

export async function GET(req: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: authError || 'Authentication required' } }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = projectAccessSchema.safeParse({
      projectId: searchParams.get('projectId'),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || 'Invalid parameters.' } },
        { status: 400 }
      );
    }

    const { projectId } = parsed.data;
    const supabaseAdmin = getSupabaseAdmin();

    // Fetch project
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('id, seller_id, title, has_archive, has_repo')
      .eq('id', projectId)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Project not found.' } }, { status: 404 });
    }

    const isSeller = project.seller_id === user.id;

    // Check transaction if not seller
    let transaction: any = null;
    if (!isSeller) {
      const { data: tx } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('project_id', projectId)
        .eq('buyer_id', user.id)
        .eq('status', 'completed')
        .maybeSingle();

      if (!tx) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'You have not purchased or claimed this project.' } },
          { status: 403 }
        );
      }
      transaction = tx;
    }

    // Fetch asset details
    const { data: asset } = await supabaseAdmin
      .from('project_assets')
      .select('file_path, file_size_bytes, github_repo_full_name, is_private_repo')
      .eq('project_id', projectId)
      .maybeSingle();

    return NextResponse.json({
      isEntitled: true,
      isSeller,
      hasArchive: Boolean(asset?.file_path),
      fileSizeBytes: asset?.file_size_bytes || null,
      repoFullName: asset?.github_repo_full_name || null,
      repoUrl: asset?.github_repo_full_name ? `https://github.com/${asset.github_repo_full_name}` : null,
      isPrivateRepo: Boolean(asset?.is_private_repo),
      inviteStatus: transaction?.invite_status || (isSeller ? 'not_applicable' : 'not_applicable'),
      inviteError: transaction?.invite_error || null,
      transactionId: transaction?.id || null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 });
  }
}
