import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/supabase';
import { inviteCollaborator, validateGitHubUser } from '@/lib/github';

const claimSchema = z.object({
  projectId: z.string().uuid('Invalid project ID format.'),
  githubUsername: z.string().trim().optional(),
});

export async function POST(req: Request) {
  try {
    // 1. Authenticate user from JWT
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: authError || 'Authentication required' } }, { status: 401 });
    }

    // 2. Validate input
    const body = await req.json().catch(() => ({}));
    const parsed = claimSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || 'Invalid parameters.' } },
        { status: 400 }
      );
    }

    const { projectId, githubUsername } = parsed.data;
    const supabaseAdmin = getSupabaseAdmin();

    // 3. Fetch project
    const { data: project, error: projError } = await supabaseAdmin
      .from('projects')
      .select('id, seller_id, title, interaction_type, price_paise, is_archived, has_repo')
      .eq('id', projectId)
      .maybeSingle();

    if (projError || !project) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Project not found.' } }, { status: 404 });
    }

    if (project.interaction_type !== 'adopt') {
      return NextResponse.json(
        { error: { code: 'INVALID_TYPE', message: 'Only Free Fork projects can be claimed.' } },
        { status: 400 }
      );
    }

    if (project.is_archived) {
      return NextResponse.json(
        { error: { code: 'ARCHIVED', message: 'This project is archived.' } },
        { status: 400 }
      );
    }

    // 4. Check for existing claim by this user
    const { data: existingTx } = await supabaseAdmin
      .from('transactions')
      .select('id, invite_status')
      .eq('project_id', projectId)
      .eq('buyer_id', user.id)
      .eq('kind', 'adopt')
      .eq('status', 'completed')
      .maybeSingle();

    if (existingTx) {
      return NextResponse.json({
        success: true,
        alreadyClaimed: true,
        message: 'You have already claimed this project.',
        transactionId: existingTx.id,
        inviteStatus: existingTx.invite_status,
      });
    }

    // 5. If repo exists and githubUsername supplied, optionally validate username
    if (project.has_repo && githubUsername) {
      const gitCheck = await validateGitHubUser(githubUsername);
      if (!gitCheck.exists) {
        return NextResponse.json(
          { error: { code: 'GITHUB_USER_NOT_FOUND', message: gitCheck.error || 'Invalid GitHub username.' } },
          { status: 400 }
        );
      }
    }

    // 6. Insert completed adopt transaction
    const claimPaymentId = `FREE_CLAIM_${crypto.randomUUID()}`;
    const { data: newTx, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        buyer_id: user.id,
        project_id: project.id,
        amount: 0,
        kind: 'adopt',
        status: 'completed',
        payment_id: claimPaymentId,
        github_username: githubUsername || null,
        invite_status: 'not_applicable',
      })
      .select('id')
      .single();

    if (txError) {
      console.error('Failed to record adopt transaction:', txError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to record project claim.' } },
        { status: 500 }
      );
    }

    // 7. If project has a repo and username was provided, dispatch collaborator invitation
    let inviteStatus: 'not_applicable' | 'sent' | 'failed' = 'not_applicable';
    let inviteError: string | null = null;

    if (project.has_repo && githubUsername) {
      const { data: asset } = await supabaseAdmin
        .from('project_assets')
        .select('github_repo_full_name')
        .eq('project_id', project.id)
        .maybeSingle();

      if (asset?.github_repo_full_name) {
        const inviteRes = await inviteCollaborator(asset.github_repo_full_name, githubUsername, 'pull');
        inviteStatus = inviteRes.success ? 'sent' : 'failed';
        inviteError = inviteRes.success ? null : inviteRes.message;

        await supabaseAdmin
          .from('transactions')
          .update({ invite_status: inviteStatus, invite_error: inviteError })
          .eq('id', newTx.id);
      }
    }

    // 8. Notify project owner
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: project.seller_id,
        type: 'claim',
        title: 'Project Forked!',
        body: `A developer claimed your Free Fork project "${project.title}".`,
        link: `/project/${project.id}`,
      });
    } catch (notifErr) {
      console.warn('Failed to notify owner on claim:', notifErr);
    }

    return NextResponse.json({
      success: true,
      alreadyClaimed: false,
      transactionId: newTx.id,
      inviteStatus,
      inviteError,
      message: 'Project claimed successfully. Check your Vault for source assets.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('Unhandled claim exception:', err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 });
  }
}
