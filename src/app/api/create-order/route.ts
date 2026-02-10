import { NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import { supabase } from '@/lib/supabase'; // Use the standard client (anon is fine for reading public projects)

export async function POST(req: Request) {
    try {
        const { projectId, currency = 'INR' } = await req.json();

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
        }

        // Fetch Project to get REAL price
        const { data: project, error } = await supabase
            .from('projects')
            .select('price, title')
            .eq('id', projectId)
            .single();

        if (error || !project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        if (project.price <= 0) {
            return NextResponse.json({ error: 'Free projects cannot be purchased via this route.' }, { status: 400 });
        }

        const options = {
            amount: Math.round(project.price * 100), // amount in lowest denomination (paise)
            currency,
            receipt: `receipt_${Date.now()}_${projectId.slice(0, 8)}`,
            notes: {
                projectId: projectId,
                title: project.title.slice(0, 30)
            }
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json(order);
    } catch (error) {
        console.error("Razorpay Order Error:", error);
        return NextResponse.json({
            error: (error as any).description || (error as any).message || 'Error creating order'
        }, { status: 500 });
    }
}
