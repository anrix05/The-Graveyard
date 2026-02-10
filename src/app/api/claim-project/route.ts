import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Secure Admin Client

export async function POST(req: Request) {
    // Secure Admin Client
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    try {
        const { projectId } = await req.json();

        // 1. Auth Check
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.replace('Bearer ', '');

        const supabaseUser = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: `Bearer ${token}` } } }
        );

        const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized User' }, { status: 401 });

        // 2. Validate Project is Free
        const { data: project, error: projError } = await supabaseAdmin
            .from('projects')
            .select('price, interaction_type')
            .eq('id', projectId)
            .single();

        if (projError || !project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

        if (project.price > 0 && project.interaction_type !== 'adopt') {
            return NextResponse.json({ error: 'This project is not free.' }, { status: 403 });
        }

        // 3. Check for Existing Claim
        const { data: existing } = await supabaseAdmin
            .from('transactions')
            .select('id')
            .eq('project_id', projectId)
            .eq('buyer_id', user.id)
            .eq('status', 'completed')
            .single();

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

        if (txError) throw txError;

        // 5. Update Stats (Optional RPC)
        await supabaseAdmin.rpc('mark_project_sold', { p_id: projectId });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Claim Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
