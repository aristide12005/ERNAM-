import { createClient } from '@supabase/supabase-js';

let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

/**
 * Gets a lazy-initialized Supabase admin client.
 * This prevents build-time errors when environment variables are missing during module evaluation.
 */
export function getSupabaseAdmin() {
    if (supabaseAdminInstance) return supabaseAdminInstance;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Prefer SERVICE_ROLE_KEY for admin tasks, fallback to ANON if necessary (though ANON usually lacks admin perms)
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        // We throw the error ONLY when the function is actually called, not during module evaluation.
        throw new Error('Supabase admin environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are missing.');
    }

    supabaseAdminInstance = createClient(supabaseUrl, supabaseKey, {
        auth: { 
            autoRefreshToken: false, 
            persistSession: false 
        }
    });

    return supabaseAdminInstance;
}
