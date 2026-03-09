import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Ping the 'projects' table (or any other table) to keep the database awake
    const { data, error } = await supabase.from('projects').select('id').limit(1);

    if (error) {
      console.error('Error pinging database:', error);
      return NextResponse.json({ error: 'Failed to ping database' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Database pinged successfully', data }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error during database ping:', error);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
