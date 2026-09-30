import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/supabase';
import { inviteCollaborator } from '@/lib/github';

const retryInviteSchema = z.object({
  transactionId: z.string().uuid('Invalid transaction ID format.'),
});

export async function POST(req: Request) {
  try {
    // 1. Authenticate user from JWT
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: authError || 'Authentication required' } }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = retryInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || 'Invalid input.' } },
        { status: 400 }
      );
    }

    const { transactionId } = parsed.data;
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Fetch transaction and verify ownership
    const { data: tx, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('id, buyer_id, project_id, status, github_username, invite_status')
      .eq('id', transactionId)
      .maybeSingle();

    if (txError || !tx) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Transaction not found.' } }, { status: 404 });
    }

    if (tx.buyer_id !== user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'You can only retry invites for your own transactions.' } },
        { status: 403 }
      );
    }

    if (tx.status !== 'completed') {
      return NextResponse.json(
        { error: { code: 'TRANSACTION_INCOMPLETE', message: 'Transaction has not been completed.' } },
        { status: 400 }
      );
    }

    if (!tx.github_username) {
      return NextResponse.json(
        { error: { code: 'NO_GITHUB_USER', message: 'No GitHub username was provided for this transaction.' } },
        { status: 400 }
      );
    }

    // 3. Fetch project repository details from project_assets
    const { data: asset } = await supabaseAdmin
      .from('project_assets')
      .select('github_repo_full_name')
      .eq('project_id', tx.project_id)
      .maybeSingle();

    if (!asset?.github_repo_full_name) {
      return NextResponse.json(
        { error: { code: 'NO_REPOSITORY', message: 'This project does not have a linked repository.' } },
        { status: 400 }
      );
    }

    // 4. Re-attempt invitation
    const inviteRes = await inviteCollaborator(asset.github_repo_full_name, tx.github_username, 'pull');
    const newStatus = inviteRes.success ? 'sent' : 'failed';
    const newError = inviteRes.success ? null : inviteRes.message;

    await supabaseAdmin
      .from('transactions')
      .update({
        invite_status: newStatus,
        invite_error: newError,
      })
      .eq('id', tx.id);

    return NextResponse.json({
      success: inviteRes.success,
      inviteStatus: newStatus,
      inviteError: newError,
      message: inviteRes.success ? 'GitHub invitation sent successfully.' : inviteRes.message,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('Unhandled retry-invite exception:', err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 });
  }
}
