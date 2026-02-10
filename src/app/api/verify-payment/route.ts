import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Securely initialized Supabase Client with Service Role (for Admin tasks)

export async function POST(req: Request) {
    // Securely initialized Supabase Client with Service Role (for Admin tasks)
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Fallback for dev if service key missing (WARN: Not secure)
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            project_id,
            amount, // We still accept this for verify check, but we trust the DB insertion
            github_username // Extract passed username
        } = await req.json();

        // Get Auth Token from Headers to identify the USER who made the request
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization Header' }, { status: 401 });
        }
        const token = authHeader.replace('Bearer ', '');

        // Initialize user-context Supabase to verify WHO is calling
        const supabaseUser = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        );

        // Verify User Logic
        const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized User' }, { status: 401 });
        }

        const key_secret = process.env.RAZORPAY_KEY_SECRET;
        if (!key_secret) {
            console.error("RAZORPAY_KEY_SECRET is missing in env variables.");
            return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
        }

        // 1. Verify Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', key_secret)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return NextResponse.json({ error: 'Invalid Payment Signature' }, { status: 400 });
        }

        // 2. Insert Transaction using ADMIN client (Bypasses RLS)
        // This ensures users cannot insert 'completed' transactions themselves via client-side
        const { error: txError } = await supabaseAdmin.from('transactions').insert({
            buyer_id: user.id,
            project_id: project_id,
            amount: amount,
            status: 'completed',
            payment_id: razorpay_payment_id,
            github_username: github_username
        });

        if (txError) {
            console.error("Transaction Insert Error:", txError);
            return NextResponse.json({ error: 'DB Insert Failed: ' + txError.message }, { status: 500 });
        }

        // 3. Mark Project as Sold & Trigger GitHub Invite
        const { error: rpcError } = await supabaseAdmin.rpc('mark_project_sold', { p_id: project_id });

        if (rpcError) {
            console.warn("RPC Failed, trying manual update", rpcError);
            const { error: updateError } = await supabaseAdmin.from('projects').update({ is_sold: true }).eq('id', project_id);
            if (updateError) {
                return NextResponse.json({ error: 'Project Update Failed: ' + updateError.message }, { status: 500 });
            }
        }

        // 4. GitHub Repository Access (New Feature)
        let inviteStatus = "skipped";
        try {
            // Fetch project repo details
            const { data: project } = await supabaseAdmin
                .from('projects')
                .select('github_repo_full_name, is_private_repo')
                .eq('id', project_id)
                .single();

            if (project?.github_repo_full_name && project.is_private_repo) {
                // Use provided username or fallback to metadata
                const targetUsername = github_username || user.user_metadata?.user_name || user.user_metadata?.preferred_username;

                if (targetUsername) {
                    console.log(`Inviting ${targetUsername} to ${project.github_repo_full_name}...`);
                    const { inviteCollaborator } = await import('@/lib/github'); // Dynamic import
                    const inviteResult = await inviteCollaborator(project.github_repo_full_name, targetUsername);
                    inviteStatus = inviteResult.success ? "sent" : "failed: " + inviteResult.message;
                } else {
                    inviteStatus = "skipped_no_github_user";
                }
            }
        } catch (ghError) {
            console.error("GitHub Integration Error:", ghError);
            inviteStatus = "error";
        }

        return NextResponse.json({ success: true, invite_status: inviteStatus });

    } catch (error: any) {
        console.error("Payment Verification Error:", error);
        return NextResponse.json({ error: 'Internal Server Error: ' + error.message }, { status: 500 });
    }
}
