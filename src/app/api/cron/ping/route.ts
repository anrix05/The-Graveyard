import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized cron request.' }, { status: 401 });
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Ping the 'projects' table to keep the database awake
    const { error } = await supabase.from('projects').select('id').limit(1);

    if (error) {
      console.error('Error pinging database during cron:', error);
      return NextResponse.json({ error: 'Failed to ping database' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Database keep-alive ping successful.' }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error during database cron ping:', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
