import { useAuth } from '@/components/providers/AuthProvider';

export const usePermissions = () => {
    const { profile, loading } = useAuth();

    /**
     * Checks if the user has a specific permission.
     * Permission format: 'module:action' (e.g., 'users:create')
     * Special case: 'Super Admin' role has all permissions.
     */
    const hasPermission = (permission: string): boolean => {
        if (loading || !profile) return false;

        // 1. If user is a Super Admin (granular check), they have all access
        // We will fetch the actual permissions list in the AuthProvider
        const userPermissions = (profile as any).granular_permissions || [];
        
        // 2. Check if the specific permission exists in the user's permission list
        return userPermissions.includes(permission) || userPermissions.includes('*');
    };

    /**
     * Checks if the user has ANY of the provided permissions.
     */
    const hasAnyPermission = (permissions: string[]): boolean => {
        return permissions.some(p => hasPermission(p));
    };

    /**
     * Checks if the user has ALL of the provided permissions.
     */
    const hasAllPermissions = (permissions: string[]): boolean => {
        return permissions.every(p => hasPermission(p));
    };

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        role: profile?.role,
        admin_role_name: (profile as any).admin_role?.name
    };
};
