import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL_PLACEHOLDER = 'https://placeholder.supabase.co';
const SUPABASE_KEY_PLACEHOLDER = 'placeholder';

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
    if (supabaseInstance) return supabaseInstance;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL_PLACEHOLDER;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_KEY_PLACEHOLDER;

    supabaseInstance = createClient(supabaseUrl, supabaseKey);
    return supabaseInstance;
}

// For backward compatibility and standard usage.
// Using placeholders during build prevents the "supabaseUrl is required" error.
// During runtime in Vercel, these will be correctly replaced by NEXT_PUBLIC_ values.
export const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL_PLACEHOLDER,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_KEY_PLACEHOLDER
);
