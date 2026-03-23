import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface CanProps {
    I: string; // The permission required (e.g., 'users:create')
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Conditional wrapper that only renders children if the user has the required permission.
 * 
 * Usage:
 * <Can I="users:create">
 *   <button>Add User</button>
 * </Can>
 */
export const Can: React.FC<CanProps> = ({ I, children, fallback = null }) => {
    const { hasPermission } = usePermissions();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <>{fallback}</>;
    }

    if (hasPermission(I)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};
