export type UserRole = 'participant' | 'instructor' | 'org_admin' | 'ernam_admin';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface UserProfile {
    id: string;
    email: string;
    phone?: string;
    full_name: string;
    role: UserRole;
    status: UserStatus;
    created_at: string;
}
