import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const claimProjectSchema = z.object({
    projectId: z.string().uuid("projectId must be a valid UUID")
});

export async function POST(req: Request) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing from environment.");
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    try {
        const rawBody = await req.json();
        const parsed = claimProjectSchema.safeParse(rawBody);

        if (!parsed.success) {
            console.warn("Claim project validation failed:", parsed.error.format());
            return NextResponse.json({ error: 'Invalid input parameters' }, { status: 400 });
        }

        const { projectId } = parsed.data;

        // 1. Auth Check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
        const token = authHeader.replace('Bearer ', '');

        const supabaseUser = createClient(
            supabaseUrl,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        );

        const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
        if (authError || !user) {
            console.warn("Auth user lookup failed during project claim:", authError);
            return NextResponse.json({ error: 'Unauthorized user' }, { status: 401 });
        }

        // 2. Validate Project is Free
        const { data: project, error: projError } = await supabaseAdmin
            .from('projects')
            .select('price, interaction_type')
            .eq('id', projectId)
            .single();

        if (projError || !project) {
            console.error(`Project lookup failed for ID ${projectId}:`, projError);
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        if (project.price > 0 && project.interaction_type !== 'adopt') {
            return NextResponse.json({ error: 'This project is not free.' }, { status: 403 });
        }

        // 3. Check for Existing Claim
        const { data: existing, error: existError } = await supabaseAdmin
            .from('transactions')
            .select('id')
            .eq('project_id', projectId)
            .eq('buyer_id', user.id)
            .eq('status', 'completed')
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ message: 'Already claimed' });
        }

        // 4. Record Transaction
        const { error: txError } = await supabaseAdmin.from('transactions').insert({
            buyer_id: user.id,
            project_id: projectId,
            amount: 0,
            status: 'completed',
            payment_id: `FREE_CLAIM_${Date.now()}`
        });

        if (txError) {
            console.error("Failed to insert free claim transaction:", txError);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        // 5. Update Stats (RPC)
        const { error: rpcError } = await supabaseAdmin.rpc('mark_project_sold', { p_id: projectId });
        if (rpcError) {
            console.warn("RPC mark_project_sold failed for claim, attempting manual update:", rpcError);
            await supabaseAdmin.from('projects').update({ is_sold: true }).eq('id', projectId);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Unhandled claim API exception:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
