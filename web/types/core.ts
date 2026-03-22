export type UserRole = 'trainee' | 'trainer' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface UserProfile {
    id: string;
    email: string;
    phone?: string;
    full_name: string;
    role: UserRole;
    status: UserStatus;
    created_at: string;
    avatar_url?: string;
}

export interface Organization {
    id: string;
    name: string;
    type: 'airport' | 'airline' | 'government' | 'security_company' | 'other';
    country?: string;
    status: 'pending' | 'approved' | 'rejected';
}

export interface TrainingStandard {
    id: string;
    code: string;
    title: string;
    description?: string;
    validity_months: number;
    active: boolean;
}

export interface Session {
    id: string;
    training_standard_id: string;
    start_date: string;
    end_date: string;
    location: string;
    delivery_mode: 'onsite' | 'online';
    status: 'planned' | 'active' | 'completed' | 'cancelled';
    created_at: string;
    // Joins
    training_standard?: TrainingStandard;
}
