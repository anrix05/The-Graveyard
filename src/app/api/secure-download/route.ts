import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const secureDownloadSchema = z.object({
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
        const parsed = secureDownloadSchema.safeParse(rawBody);

        if (!parsed.success) {
            console.warn("Secure download validation failed:", parsed.error.format());
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
            console.warn("Auth user lookup failed during secure download:", authError);
            return NextResponse.json({ error: 'Unauthorized user' }, { status: 401 });
        }

        // 2. Fetch Project File Path
        const { data: project, error: projError } = await supabaseAdmin
            .from('projects')
            .select('file_url, seller_id')
            .eq('id', projectId)
            .single();

        if (projError || !project || !project.file_url) {
            console.error(`Project lookup failed or missing file_url for ID ${projectId}:`, projError);
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // 3. Verify Access Rights (Owner OR Buyer OR Partner)
        let hasAccess = false;

        // A. Is Owner?
        if (project.seller_id === user.id) hasAccess = true;

        if (!hasAccess) {
            // B. Is Buyer/Partner?
            const { data: tx, error: txError } = await supabaseAdmin
                .from('transactions')
                .select('id')
                .eq('project_id', projectId)
                .eq('buyer_id', user.id)
                .eq('status', 'completed')
                .maybeSingle();

            if (txError) {
                console.error("Failed to query transaction for secure download access:", txError);
                return NextResponse.json({ error: 'Access verification failed' }, { status: 500 });
            }

            if (tx) hasAccess = true;
        }

        if (!hasAccess) {
            return NextResponse.json({ error: 'Access Denied. Purchase required.' }, { status: 403 });
        }

        // 4. Generate Signed URL (Valid for 60 seconds)
        const { data, error: signedUrlError } = await supabaseAdmin
            .storage
            .from('project-files')
            .createSignedUrl(project.file_url, 60);

        if (signedUrlError) {
            console.error("Failed to generate signed storage URL:", signedUrlError);
            return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 });
        }

        return NextResponse.json({ url: data.signedUrl });

    } catch (error: any) {
        console.error("Unhandled download API exception:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
