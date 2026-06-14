import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { razorpay } from '@/lib/razorpay';
import { z } from 'zod';

// Define strict validation schema
const verifyPaymentSchema = z.object({
    razorpay_order_id: z.string().min(1, "razorpay_order_id is required"),
    razorpay_payment_id: z.string().min(1, "razorpay_payment_id is required"),
    razorpay_signature: z.string().length(64, "razorpay_signature must be a 64-character hex string"),
    project_id: z.string().uuid("project_id must be a valid UUID"),
    amount: z.number().positive("amount must be a positive number"),
    github_username: z.string().min(1, "github_username is required").regex(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i, "Invalid GitHub username format")
});

export async function POST(req: Request) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment.");
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        // Parse and validate request body
        const rawBody = await req.json();
        const parsed = verifyPaymentSchema.safeParse(rawBody);
        
        if (!parsed.success) {
            console.warn("Input validation failed:", parsed.error.format());
            return NextResponse.json({ error: 'Invalid input parameters' }, { status: 400 });
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            project_id,
            amount,
            github_username
        } = parsed.data;

        // Get Auth Token from Headers
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');

        // Initialize user-context Supabase to verify WHO is calling
        const supabaseUser = createClient(
            supabaseUrl,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        );

        const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
        if (authError || !user) {
            console.warn("User auth verification failed:", authError);
            return NextResponse.json({ error: 'Unauthorized user' }, { status: 401 });
        }

        const key_secret = process.env.RAZORPAY_KEY_SECRET;
        if (!key_secret) {
            console.error("RAZORPAY_KEY_SECRET is missing.");
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // 1. Verify Payment Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', key_secret)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;
        if (!isAuthentic) {
            console.warn(`Signature verification failed. expected=${expectedSignature}, signature=${razorpay_signature}`);
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }

        // 2. Fetch Project details from Database
        const { data: project, error: projectError } = await supabaseAdmin
            .from('projects')
            .select('price, title, github_repo_full_name, is_private_repo')
            .eq('id', project_id)
            .single();

        if (projectError || !project) {
            console.error(`Project not found in database: ${project_id}`, projectError);
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        // 3. Verify Razorpay Order Details from API
        let order;
        try {
            order = await razorpay.orders.fetch(razorpay_order_id);
        } catch (fetchError) {
            console.error("Failed to fetch order details from Razorpay:", fetchError);
            return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
        }

        if (!order) {
            console.error(`Razorpay order not found: ${razorpay_order_id}`);
            return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
        }

        const orderAmount = order.amount / 100; // in INR
        if (orderAmount !== amount || orderAmount !== Number(project.price)) {
            console.error(`Inconsistent amount: orderAmount=${orderAmount}, inputAmount=${amount}, projectPrice=${project.price}`);
            return NextResponse.json({ error: 'Payment integrity check failed' }, { status: 400 });
        }

        if (order.notes?.projectId !== project_id) {
            console.error(`Inconsistent projectId in order notes: expected=${project_id}, found=${order.notes?.projectId}`);
            return NextResponse.json({ error: 'Payment integrity check failed' }, { status: 400 });
        }

        // 4. Enforce Idempotency
        const { data: existingTx, error: selectError } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('payment_id', razorpay_payment_id)
            .maybeSingle();

        if (selectError) {
            console.error("Error checking existing transaction:", selectError);
            return NextResponse.json({ error: 'Database query error' }, { status: 500 });
        }

        if (existingTx) {
            if (existingTx.status === 'completed') {
                const metadata = existingTx.metadata || {};
                const projectSoldUpdated = metadata.project_sold_updated === true;
                const githubInviteStatus = metadata.github_invite_status;

                let inviteStatus = githubInviteStatus || "skipped";
                let needsUpdate = false;
                let updatedMetadata = { ...metadata };

                // Retry marking project as sold if it failed previously
                if (!projectSoldUpdated) {
                    console.log("Retrying project sold update for project:", project_id);
                    const { error: rpcError } = await supabaseAdmin.rpc('mark_project_sold', { p_id: project_id });
                    let soldUpdated = false;
                    if (!rpcError) {
                        soldUpdated = true;
                    } else {
                        const { error: updateError } = await supabaseAdmin.from('projects').update({ is_sold: true }).eq('id', project_id);
                        if (!updateError) soldUpdated = true;
                    }
                    if (soldUpdated) {
                        updatedMetadata.project_sold_updated = true;
                        needsUpdate = true;
                    }
                }

                // Retry GitHub invitation if it failed previously
                if (inviteStatus !== 'sent' && inviteStatus !== 'skipped') {
                    if (project.github_repo_full_name && project.is_private_repo) {
                        console.log(`Retrying GitHub invitation for ${github_username} to ${project.github_repo_full_name}...`);
                        const { inviteCollaborator } = await import('@/lib/github');
                        const inviteResult = await inviteCollaborator(project.github_repo_full_name, github_username);
                        inviteStatus = inviteResult.success ? "sent" : "failed: " + inviteResult.message;
                        updatedMetadata.github_invite_status = inviteStatus;
                        if (!inviteResult.success) {
                            updatedMetadata.github_invite_error = inviteResult.message;
                        } else {
                            delete updatedMetadata.github_invite_error;
                        }
                        needsUpdate = true;
                    }
                }

                if (needsUpdate) {
                    await supabaseAdmin
                        .from('transactions')
                        .update({ metadata: updatedMetadata })
                        .eq('id', existingTx.id);
                }

                return NextResponse.json({
                    success: true,
                    invite_status: inviteStatus,
                    message: "Payment already verified."
                });
            }
        }

        // 5. Insert Initial Transaction with tracking state
        const { data: insertedTx, error: txError } = await supabaseAdmin.from('transactions').insert({
            buyer_id: user.id,
            project_id: project_id,
            amount: amount,
            status: 'completed',
            payment_id: razorpay_payment_id,
            github_username: github_username,
            metadata: {
                project_sold_updated: false,
                github_invite_status: 'pending'
            }
        }).select().single();

        if (txError || !insertedTx) {
            console.error("Transaction insert failed:", txError);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        // 6. Perform Post-payment side-effects
        let projectSoldUpdated = false;
        const { error: rpcError } = await supabaseAdmin.rpc('mark_project_sold', { p_id: project_id });
        if (!rpcError) {
            projectSoldUpdated = true;
        } else {
            console.warn("RPC mark_project_sold failed, attempting manual update:", rpcError);
            const { error: updateError } = await supabaseAdmin
                .from('projects')
                .update({ is_sold: true })
                .eq('id', project_id);
            if (!updateError) {
                projectSoldUpdated = true;
            } else {
                console.error("Manual project sold update failed:", updateError);
            }
        }

        let inviteStatus = "skipped";
        let inviteError = undefined;

        if (project.github_repo_full_name && project.is_private_repo) {
            try {
                console.log(`Sending GitHub invitation to ${github_username} for ${project.github_repo_full_name}...`);
                const { inviteCollaborator } = await import('@/lib/github');
                const inviteResult = await inviteCollaborator(project.github_repo_full_name, github_username);
                inviteStatus = inviteResult.success ? "sent" : "failed: " + inviteResult.message;
                if (!inviteResult.success) {
                    inviteError = inviteResult.message;
                }
            } catch (ghError: any) {
                console.error("GitHub invitation exception:", ghError);
                inviteStatus = "error";
                inviteError = ghError.message || String(ghError);
            }
        }

        // 7. Update transaction metadata with result of side effects
        const finalMetadata = {
            project_sold_updated: projectSoldUpdated,
            github_invite_status: inviteStatus,
            ...(inviteError ? { github_invite_error: inviteError } : {})
        };

        await supabaseAdmin
            .from('transactions')
            .update({ metadata: finalMetadata })
            .eq('id', insertedTx.id);

        if (!projectSoldUpdated || inviteStatus.startsWith("failed") || inviteStatus === "error") {
            console.warn(`Payment verified but some side effects failed. projectSoldUpdated=${projectSoldUpdated}, inviteStatus=${inviteStatus}`);
            return NextResponse.json({
                success: true,
                invite_status: inviteStatus,
                warning: "Payment verified, but post-payment actions failed. They will be retried automatically."
            });
        }

        return NextResponse.json({ success: true, invite_status: inviteStatus });

    } catch (error: any) {
        console.error("Unhandled verification exception:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
