
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Client (Service Role for Admin Actions)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn("Missing Supabase credentials in api/admin/decline-organization");
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
        const body = await req.json();
        const { org_id, adminId } = body;

        if (!org_id) {
            return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
        }

        // 1. Fetch Application Details via Org ID
        const { data: org } = await supabaseAdmin.from('organizations').select('name').eq('id', org_id).single();
        if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

        const orgName = org.name;

        // 2. Find latest pending application
        const { data: application } = await supabaseAdmin
            .from('applications')
            .select('*')
            .eq('organization_name', orgName)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // 3. Update Organization -> rejected (effectively declined)
        const { error: orgUpdateError } = await supabaseAdmin
            .from('organizations')
            .update({ status: 'rejected' })
            .eq('id', org_id);

        if (orgUpdateError) throw orgUpdateError;

        // 4. Update Application -> rejected (if exists)
        if (application) {
            await supabaseAdmin
                .from('applications')
                .update({
                    status: 'rejected',
                    reviewed_by: adminId || null
                })
                .eq('id', application.id);
        }

        // 5. Update Org Admin User -> suspended (if exists)
        const { data: users } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('organization_id', org_id)
            .eq('role', 'org_admin');

        if (users && users.length > 0) {
            const userIds = users.map(u => u.id);
            await supabaseAdmin
                .from('users')
                .update({ status: 'suspended' })
                .in('id', userIds);
        }

        // 6. Audit Log
        if (adminId) {
            await supabaseAdmin.from('audit_logs').insert({
                action: 'ORGANIZATION_DECLINED_API',
                target_resource: org_id,
                actor_id: adminId,
                details: {
                    org_name: orgName,
                    application_id: application?.id
                }
            });
        }

        return NextResponse.json({ message: 'Organization declined successfully' });

    } catch (error: any) {
        console.error("Org Decline Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
