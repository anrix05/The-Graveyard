import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: Request) {
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

        // 2. Fetch Project File Path
        const { data: project } = await supabaseAdmin
            .from('projects')
            .select('file_url, seller_id')
            .eq('id', projectId)
            .single();

        if (!project || !project.file_url) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // 3. Verify Access Rights (Owner OR Buyer OR Partner)
        let hasAccess = false;

        // A. Is Owner?
        if (project.seller_id === user.id) hasAccess = true;

        if (!hasAccess) {
            // B. Is Buyer/Partner?
            const { data: tx } = await supabaseAdmin
                .from('transactions')
                .select('id')
                .eq('project_id', projectId)
                .eq('buyer_id', user.id)
                .eq('status', 'completed')
                .single();

            if (tx) hasAccess = true;
        }

        if (!hasAccess) {
            return NextResponse.json({ error: 'Access Denied. Purchase required.' }, { status: 403 });
        }

        // 4. Generate Signed URL (Valid for 60 seconds)
        const { data, error } = await supabaseAdmin
            .storage
            .from('project-files')
            .createSignedUrl(project.file_url, 60);

        if (error) throw error;

        return NextResponse.json({ url: data.signedUrl });

    } catch (error: any) {
        console.error("Download Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
