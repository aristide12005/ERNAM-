export type UserRole = 'participant' | 'instructor' | 'org_admin' | 'ernam_admin' | 'maintainer' | 'developer';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface UserProfile {
    id: string;
    email: string;
    phone?: string;
    full_name: string;
    role: UserRole;
    status: UserStatus;
    organization_id?: string;
    created_at: string;
}

export type SessionStatus = 'planned' | 'scheduled' | 'confirmed' | 'active' | 'in_progress' | 'completed' | 'cancelled' | 'audited';

export interface Session {
    id: string;
    training_standard_id: string;
    start_date: string;
    end_date: string;
    location: string;
    delivery_mode: 'onsite' | 'online';
    status: SessionStatus;
    max_participants: number;
    created_at: string;
    // Relations (often fetched with joins)
    training_standard?: {
        code: string;
        title: string;
        validity_months: number;
    };
}
