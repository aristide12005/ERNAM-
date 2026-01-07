
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in api/org/invite-user");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, fullName, organizationId } = body;

        // Security: In production, verify the session token from the header matches an org_admin 
        // who belongs to organizationId. 
        // For this MVP step, we trust the client logic but in a real app -> Validate Authorization Header!

        if (!email || !fullName || !organizationId) {
            return NextResponse.json({ error: 'Missing field' }, { status: 400 });
        }

        // 1. Create User with Temp Password (since SMTP is likely not configured)
        const TEMP_PASSWORD = 'Ernam123!';

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: TEMP_PASSWORD,
            email_confirm: true,
            user_metadata: { full_name: fullName, organization_id: organizationId }
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        if (!authData.user) {
            return NextResponse.json({ error: 'Creation failed' }, { status: 500 });
        }

        // 2. Ensure Profile is correct (Role = participant, Org ID set)
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: authData.user.id,
                email: email,
                role: 'participant',
                full_name: fullName,
                organization_id: organizationId,
                status: 'approved' // Auto-activate (using 'approved' as per UserStatus type)
            });

        if (profileError) {
            console.error('Profile update failed:', profileError);
            return NextResponse.json({ error: 'Profile update failed' }, { status: 500 });
        }

        return NextResponse.json({
            message: 'User created successfully',
            user: authData.user,
            tempPassword: TEMP_PASSWORD
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
