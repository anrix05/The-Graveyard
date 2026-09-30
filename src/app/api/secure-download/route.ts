import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/supabase';

const downloadQuerySchema = z.object({
  projectId: z.string().uuid('Invalid project ID format.'),
});

export async function GET(req: Request) {
  try {
    // 1. Authenticate user from JWT
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: authError || 'Authentication required' } }, { status: 401 });
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(req.url);
    const parsed = downloadQuerySchema.safeParse({
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

    // 3. Verify user is either the seller or an authorized buyer/claimer with completed transaction
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('id, seller_id, title')
      .eq('id', projectId)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Project not found.' } }, { status: 404 });
    }

    const isSeller = project.seller_id === user.id;

    if (!isSeller) {
      const { data: tx } = await supabaseAdmin
        .from('transactions')
        .select('id')
        .eq('project_id', projectId)
        .eq('buyer_id', user.id)
        .eq('status', 'completed')
        .maybeSingle();

      if (!tx) {
        return NextResponse.json(
          {
            error: {
              code: 'FORBIDDEN',
              message: 'You are not authorized to download this asset. Purchase or claim is required.',
            },
          },
          { status: 403 }
        );
      }
    }

    // 4. Fetch asset record from project_assets
    const { data: asset } = await supabaseAdmin
      .from('project_assets')
      .select('file_path')
      .eq('project_id', projectId)
      .maybeSingle();

    if (!asset?.file_path) {
      return NextResponse.json(
        { error: { code: 'NO_FILE', message: 'No downloadable file archive exists for this project.' } },
        { status: 404 }
      );
    }

    // 5. Generate short-lived signed URL (60 seconds)
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from('project-files')
      .createSignedUrl(asset.file_path, 60);

    if (signError || !signedData?.signedUrl) {
      console.error('Failed to create signed download URL:', signError);
      return NextResponse.json(
        { error: { code: 'STORAGE_ERROR', message: 'Failed to generate secure download link.' } },
        { status: 500 }
      );
    }

    // Return downloadUrl only (never leak file_path)
    return NextResponse.json({ downloadUrl: signedData.signedUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('Unhandled secure-download exception:', err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 });
  }
}
