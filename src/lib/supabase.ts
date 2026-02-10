import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Fallback to prevent app crash during setup if keys are missing
// The auth calls will simply fail instead of the whole app crashing
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseKey || 'placeholder';

export const supabase = createClient(url, key);
