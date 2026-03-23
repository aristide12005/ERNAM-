import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password, fullName, role, adminId } = body;

        if (!email || !password || !fullName || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate role against schema constraints
        const validRoles = ['participant', 'instructor', 'org_admin', 'ernam_admin', 'maintainer', 'developer'];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        // 1. Create Auth User
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (authError) throw authError;

        // 2. Upsert into public.users (Profile)
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: authUser.user.id,
                email,
                full_name: fullName,
                role,
                status: 'approved'
            });

        if (profileError) {
            console.error("Profile upsert error:", profileError);
            throw profileError;
        }

        if (adminId) {
            await supabaseAdmin.from('audit_logs').insert({
                action: 'USER_CREATED',
                entity_type: 'user',
                entity_id: authUser.user.id,
                actor_id: adminId,
                ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
            });
        }

        return NextResponse.json({ message: 'User created successfully', user: authUser.user });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, role, status, full_name, adminId } = body;

        if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

        // Validate role and status against schema constraints if provided
        if (role) {
            const validRoles = ['participant', 'instructor', 'org_admin', 'ernam_admin', 'maintainer', 'developer'];
            if (!validRoles.includes(role)) {
                return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
            }
        }

        if (status) {
            const validStatuses = ['pending', 'approved', 'rejected', 'suspended'];
            if (!validStatuses.includes(status)) {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
            }
        }

        const { data, error } = await supabaseAdmin
            .from('users')
            .update({ role, status, full_name })
            .eq('id', id)
            .select().single();

        if (error) throw error;

        if (adminId) {
            await supabaseAdmin.from('audit_logs').insert({
                action: 'USER_UPDATED',
                entity_type: 'user',
                entity_id: id,
                actor_id: adminId,
                ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
                details: { role, status }
            });
        }

        return NextResponse.json({ message: 'User updated successfully', user: data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const adminId = searchParams.get('adminId');

        if (!id) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

        // 1. Delete from public.users first to avoid foreign key violations
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', id);

        if (profileError) throw profileError;

        // 2. Delete from Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (authError) throw authError;

        if (adminId) {
            await supabaseAdmin.from('audit_logs').insert({
                action: 'USER_DELETED',
                entity_type: 'user',
                entity_id: id,
                actor_id: adminId,
                ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
            });
        }

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}