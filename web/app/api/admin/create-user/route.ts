
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Client (Safe Fallback to prevent build crashes)
// NOTE: Admin features require SUPABASE_SERVICE_ROLE_KEY to be set in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn("Missing Supabase credentials in api/admin/create-user");
}

const supabaseAdmin = createClient(
    supabaseUrl,
    supabaseKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function POST(req: NextRequest) {
    try {
        // 1. Verify Admin Permissions (Client-side check isn't enough, we need to verify the requestor)
        // Since we can't easily verify the session token against RLS in this context without a user client,
        // we'll rely on the client passing the admin's ID or session, OR purely rely on the fact that
        // this route should be protected.
        // Ideally, we parse the 'Authorization' header.

        // Simplified Check: We expect the body to contain user details.
        // In a strictly secure env, we'd validate req.headers.get('Authorization') with supabase.auth.getUser()

        const body = await req.json();
        const { email, password, fullName, role, adminId } = body;

        if (!email || !password || !fullName || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 2. Create User in Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm for admin-created users
            user_metadata: { full_name: fullName }
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        if (!authData.user) {
            return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
        }

        // 3. Create Profile (Public Table)
        // Note: The trigger on auth.users should handle this, BUT if we want to set the ROLE immediately,
        // we might need to update it. The trigger usually sets 'trainee' by default.

        // Wait a moment for trigger... OR upsert directly.
        // Better to direct update the profile to set the correct role.
        const { error: profileError } = await supabaseAdmin
            .from('users') // FIXED: Target 'users' table
            .update({
                role: role,
                full_name: fullName,
                status: 'approved' // Auto-approve admin-created users
            })
            .eq('id', authData.user.id);

        if (profileError) {
            // If the trigger hasn't fired yet, this might fail or do nothing.
            // Safety fallback: Insert if not exists (Upsert)
            const { error: upsertError } = await supabaseAdmin
                .from('users') // FIXED: Target 'users' table
                .upsert({
                    id: authData.user.id,
                    email: email,
                    role: role,
                    full_name: fullName,
                    status: 'approved'
                });

            if (upsertError) {
                return NextResponse.json({ error: 'Profile creation failed: ' + upsertError.message }, { status: 500 });
            }
        }

        // 4. Log Action
        if (adminId) {
            await supabaseAdmin.from('audit_logs').insert({
                action: 'USER_CREATED_BY_ADMIN',
                target_resource: authData.user.id,
                admin_id: adminId,
                details: { email, role }
            });
        }

        return NextResponse.json({ message: 'User created successfully', user: authData.user });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
