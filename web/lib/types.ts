export type UserRole = 'admin' | 'trainer' | 'trainee';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
    id: string;
    full_name: string | null;
    role: UserRole;
    status: UserStatus;
    created_at: string;
}
