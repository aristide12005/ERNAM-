
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log('--- ADMIN ID FIX START ---');

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Checking Env Vars:');
    console.log('URL:', url ? 'Present' : 'MISSING');
    console.log('KEY:', key ? 'Present' : 'MISSING');

    if (!url || !key) {
        return NextResponse.json({
            error: 'Missing Environment Variables',
            details: {
                url: !!url,
                key: !!key
            }
        }, { status: 500 });
    }

    try {
        // Initialize Admin Client
        const supabaseAdmin = createClient(url, key);
        const email = 'aristide@ernam.aero';

        console.log(`Listing users for: ${email}`);

        // 1. Get Auth User ID
        const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();

        if (authError) {
            console.error('Auth List Error:', authError);
            return NextResponse.json({ error: 'Failed to list auth users', details: authError }, { status: 500 });
        }

        const adminUser = users?.find(u => u.email === email);

        if (!adminUser) {
            console.error('Auth User Not Found');
            return NextResponse.json({ error: 'Auth user not found', email }, { status: 404 });
        }

        console.log(`Found Auth ID: ${adminUser.id}`);

        // 2. Update Public User ID directly
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                id: adminUser.id,
                role: 'ernam_admin',
                status: 'approved'
            })
            .eq('email', email);

        if (updateError) {
            console.error('Update Error:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        console.log('Update Success');

        return NextResponse.json({
            success: true,
            message: 'Admin ID synced successfully',
            userId: adminUser.id
        });

    } catch (err: any) {
        console.error('Unexpected Crash:', err);
        return NextResponse.json({
            error: 'Unexpected Server Error',
            message: err.message,
            stack: err.stack
        }, { status: 500 });
    }
}
