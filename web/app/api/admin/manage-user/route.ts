
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

        // 1. Create Auth User
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: fullName }
        });

        if (authError) throw authError;

        // 2. Update/Insert into public.users (Profile)
        // Usually handled by a trigger, but many devs do it explicitly too
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .update({ role, full_name: fullName, status: 'approved' })
            .eq('id', authUser.user.id);

        if (profileError) {
            console.error("Profile sync error:", profileError);
        }

        if (adminId) {
            await supabaseAdmin.from('audit_logs').insert({
                action: 'USER_CREATED',
                target_resource: authUser.user.id,
                actor_id: adminId,
                entity_type: 'user',
                entity_id: authUser.user.id
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

        const { data, error } = await supabaseAdmin
            .from('users')
            .update({ role, status, full_name })
            .eq('id', id)
            .select().single();

        if (error) throw error;

        if (adminId) {
            await supabaseAdmin.from('audit_logs').insert({
                action: 'USER_UPDATED',
                target_resource: id,
                actor_id: adminId,
                entity_type: 'user',
                entity_id: id,
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

        // Deleting from Auth deletes from public users if mapped via Trigger
        // But let's be safe and delete profile if it lives
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
        if (authError) throw authError;

        if (adminId) {
            await supabaseAdmin.from('audit_logs').insert({
                action: 'USER_DELETED',
                target_resource: id,
                actor_id: adminId,
                entity_type: 'user',
                entity_id: id
            });
        }

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
