import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/supabase';
import { getRazorpayClient } from '@/lib/razorpay';
import { validateGitHubUser } from '@/lib/github';

const createOrderSchema = z.object({
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

    // 2. Validate input payload
    const body = await req.json().catch(() => ({}));
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message || 'Invalid input.' } },
        { status: 400 }
      );
    }

    const { projectId, githubUsername } = parsed.data;
    const supabaseAdmin = getSupabaseAdmin();
    const razorpay = getRazorpayClient();

    // 3. Fetch project details
    const { data: project, error: projError } = await supabaseAdmin
      .from('projects')
      .select('id, seller_id, title, interaction_type, price_paise, is_sold, is_archived, has_repo')
      .eq('id', projectId)
      .maybeSingle();

    if (projError || !project) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Project not found.' } }, { status: 404 });
    }

    if (project.interaction_type !== 'buy') {
      return NextResponse.json(
        { error: { code: 'INVALID_TYPE', message: 'This project is not designated for commercial purchase.' } },
        { status: 400 }
      );
    }

    if (project.is_sold) {
      return NextResponse.json(
        { error: { code: 'ALREADY_SOLD', message: 'This project has already been purchased.' } },
        { status: 409 }
      );
    }

    if (project.is_archived) {
      return NextResponse.json(
        { error: { code: 'ARCHIVED', message: 'This project has been archived by the owner.' } },
        { status: 400 }
      );
    }

    if (project.seller_id === user.id) {
      return NextResponse.json(
        { error: { code: 'OWNER_PURCHASE', message: 'You cannot purchase your own project.' } },
        { status: 400 }
      );
    }

    // 4. Soft hold enforcement: check for active unexpired pending orders by other users
    const nowIso = new Date().toISOString();
    const { data: activePending } = await supabaseAdmin
      .from('transactions')
      .select('id, buyer_id, expires_at')
      .eq('project_id', projectId)
      .eq('status', 'pending')
      .gt('expires_at', nowIso)
      .neq('buyer_id', user.id)
      .limit(1);

    if (activePending && activePending.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: 'PROJECT_ON_HOLD',
            message: 'Another user is currently checking out this project. Please try again in a few minutes.',
          },
        },
        { status: 409 }
      );
    }

    // 5. If project has a GitHub repo, validate the buyer's GitHub username
    if (project.has_repo) {
      if (!githubUsername) {
        return NextResponse.json(
          {
            error: {
              code: 'GITHUB_USER_REQUIRED',
              message: 'A GitHub username is required to receive collaborator access to this repository.',
            },
          },
          { status: 400 }
        );
      }

      const gitValidation = await validateGitHubUser(githubUsername);
      if (!gitValidation.exists) {
        return NextResponse.json(
          {
            error: {
              code: 'GITHUB_USER_NOT_FOUND',
              message: gitValidation.error || `GitHub user "${githubUsername}" could not be verified.`,
            },
          },
          { status: 400 }
        );
      }
    }

    // 6. Create Razorpay Order
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes hold
    const orderOptions = {
      amount: project.price_paise,
      currency: 'INR',
      receipt: `RCP_${projectId.slice(0, 8)}_${Date.now().toString().slice(-6)}`,
      notes: {
        projectId: project.id,
        buyerId: user.id,
        githubUsername: githubUsername || '',
      },
    };

    const razorpayOrder = await razorpay.orders.create(orderOptions);

    // 7. Insert pending transaction
    const { error: txError } = await supabaseAdmin.from('transactions').insert({
      buyer_id: user.id,
      project_id: project.id,
      amount: project.price_paise,
      kind: 'buy',
      status: 'pending',
      razorpay_order_id: razorpayOrder.id,
      payment_id: razorpayOrder.id,
      expires_at: expiresAt,
      github_username: githubUsername || null,
      metadata: {
        receipt: orderOptions.receipt,
        project_title: project.title,
      },
    });

    if (txError) {
      console.error('Failed to create pending transaction record:', txError);
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: 'Failed to initialize transaction session.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      expiresAt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('Unhandled exception in /api/create-order:', err);
    return NextResponse.json({ error: { code: 'SERVER_ERROR', message } }, { status: 500 });
  }
}
