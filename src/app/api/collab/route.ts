import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/supabase';

const createCollabSchema = z.object({
  projectId: z.string().uuid('Invalid project ID format.'),
  pitch: z.string().min(50, 'Pitch must be at least 50 characters long.'),
  background: z.string().optional(),
  contact: z.string().min(3, 'Please provide valid contact information (email/handle).'),
  portfolioUrl: z.string().url('Invalid URL format.').optional().or(z.literal('')),
});

const updateCollabSchema = z.object({
  requestId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  action: z.enum(['accept', 'reject', 'withdraw', 'mark_filled']),
});

// POST: Create collab request
export async function POST(req: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: authError || 'Authentication required' } }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = createCollabSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || 'Invalid parameters.' } },
        { status: 400 }
      );
    }

    const { projectId, pitch, background, contact, portfolioUrl } = parsed.data;
    const supabaseAdmin = getSupabaseAdmin();

    // Verify project exists and is collab
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('id, seller_id, title, interaction_type, is_collab_filled, is_archived')
      .eq('id', projectId)
      .maybeSingle();

    if (!project) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Project not found.' } }, { status: 404 });
    }

    if (project.interaction_type !== 'collab') {
      return NextResponse.json({ error: { code: 'INVALID_TYPE', message: 'This project is not seeking collaborators.' } }, { status: 400 });
    }

    if (project.is_collab_filled) {
      return NextResponse.json({ error: { code: 'POSITION_FILLED', message: 'The partner position for this project is already filled.' } }, { status: 400 });
    }

    if (project.seller_id === user.id) {
      return NextResponse.json({ error: { code: 'OWNER_APPLICATION', message: 'You cannot apply to your own project.' } }, { status: 400 });
    }

    // Insert request
    const { data: newReq, error: insertError } = await supabaseAdmin
      .from('collab_requests')
      .insert({
        project_id: projectId,
        applicant_id: user.id,
        pitch,
        background: background || null,
        contact,
        portfolio_url: portfolioUrl || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: { code: 'ALREADY_APPLIED', message: 'You have already submitted a collaboration pitch for this project.' } },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: { code: 'DATABASE_ERROR', message: insertError.message } }, { status: 500 });
    }

    // Notify project owner
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: project.seller_id,
        type: 'collab_pitch',
        title: 'New Collaboration Pitch!',
        body: `An operative pitched to partner on "${project.title}".`,
        link: `/dashboard?tab=collabs`,
      });
    } catch (notifErr) {
      console.warn('Failed to notify owner:', notifErr);
    }

    return NextResponse.json({ success: true, request: newReq });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 });
  }
}

// PATCH: Update request status or mark position filled
export async function PATCH(req: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: authError || 'Authentication required' } }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = updateCollabSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || 'Invalid parameters.' } },
        { status: 400 }
      );
    }

    const { requestId, projectId, action } = parsed.data;
    const supabaseAdmin = getSupabaseAdmin();

    if (action === 'mark_filled') {
      if (!projectId) {
        return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'projectId is required to mark position filled.' } }, { status: 400 });
      }

      // Check seller owns project
      const { data: proj } = await supabaseAdmin.from('projects').select('seller_id').eq('id', projectId).single();
      if (!proj || proj.seller_id !== user.id) {
        return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Only the project owner can mark positions filled.' } }, { status: 403 });
      }

      await supabaseAdmin.from('projects').update({ is_collab_filled: true }).eq('id', projectId);
      return NextResponse.json({ success: true, message: 'Project collaboration position marked filled.' });
    }

    if (!requestId) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'requestId is required.' } }, { status: 400 });
    }

    // Fetch request with project info
    const { data: reqRecord } = await supabaseAdmin
      .from('collab_requests')
      .select('*, project:projects(*)')
      .eq('id', requestId)
      .maybeSingle();

    if (!reqRecord) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Collaboration request not found.' } }, { status: 404 });
    }

    // Action: withdraw (applicant only)
    if (action === 'withdraw') {
      if (reqRecord.applicant_id !== user.id) {
        return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'You can only withdraw your own applications.' } }, { status: 403 });
      }

      await supabaseAdmin.from('collab_requests').update({ status: 'withdrawn' }).eq('id', requestId);
      return NextResponse.json({ success: true, message: 'Application withdrawn.' });
    }

    // Actions: accept or reject (owner only)
    if (reqRecord.project?.seller_id !== user.id) {
      return NextResponse.json({ error: { code: 'FORBIDDEN', message: 'Only the project owner can accept or reject pitches.' } }, { status: 403 });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    await supabaseAdmin.from('collab_requests').update({ status: newStatus }).eq('id', requestId);

    // If accepted:
    if (newStatus === 'accepted') {
      // 1. Create first message thread between owner and applicant
      const threadKey = `${[user.id, reqRecord.applicant_id].sort().join(':')}:${reqRecord.project_id}`;
      await supabaseAdmin.from('messages').insert({
        sender_id: user.id,
        receiver_id: reqRecord.applicant_id,
        project_id: reqRecord.project_id,
        thread_key: threadKey,
        content: `👋 Hey! I reviewed your collaboration pitch for "${reqRecord.project?.title}" and accepted your request. Let's discuss details and next steps here!`,
      });

      // 2. Notify applicant
      await supabaseAdmin.from('notifications').insert({
        user_id: reqRecord.applicant_id,
        type: 'pitch_accepted',
        title: 'Pitch Accepted!',
        body: `Your collaboration pitch for "${reqRecord.project?.title}" was accepted! Open messages to connect.`,
        link: `/dashboard?tab=messages`,
      });
    } else {
      // Notify applicant of rejection
      await supabaseAdmin.from('notifications').insert({
        user_id: reqRecord.applicant_id,
        type: 'pitch_rejected',
        title: 'Application Update',
        body: `The owner reviewed your pitch for "${reqRecord.project?.title}".`,
        link: `/dashboard?tab=collabs`,
      });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 });
  }
}
