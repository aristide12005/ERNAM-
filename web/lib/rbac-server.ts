import { getSupabaseAdmin } from './supabaseAdmin';

/**
 * Server-side check for granular permissions.
 * Does not rely on client-side context.
 */
export async function hasPermission(adminId: string | null, module: string, action: string): Promise<boolean> {
    if (!adminId) return false;

    const supabaseAdmin = getSupabaseAdmin();

    // Use a direct join query for efficiency
    const { data, error } = await supabaseAdmin
        .from('users')
        .select(`
            admin_roles!inner (
                role_permissions!inner (
                    permissions!inner (
                        module,
                        action
                    )
                )
            )
        `)
        .eq('id', adminId)
        .eq('admin_roles.role_permissions.permissions.module', module)
        .eq('admin_roles.role_permissions.permissions.action', action)
        .maybeSingle();

    if (error) {
        console.error(`[RBAC Server] Error checking permission ${module}:${action} for ${adminId}:`, error);
        return false;
    }

    return !!data;
}
