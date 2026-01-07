
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Client (Service Role for Admin Actions)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn("Missing Supabase credentials in api/admin/approve-organization");
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
        const { application_id, adminId } = body;

        let application;
        if (application_id) {
            // 1. Fetch Application Details by ID
            const { data, error } = await supabaseAdmin
                .from('applications')
                .select('*')
                .eq('id', application_id)
                .single();

            if (error || !data) return NextResponse.json({ error: 'Application not found' }, { status: 404 });
            application = data;
        } else if (body.org_id) {
            // 1b. Fetch Application by Org ID (Reverse Lookup)
            // First get the org name to match safely or rely on metadata
            const { data: org } = await supabaseAdmin.from('organizations').select('name').eq('id', body.org_id).single();
            if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

            // Find latest application for this org, regardless of status (to allow re-activation of rejected ones)
            // But prefer pending over rejected if both exist (though unlikely for one org)
            const { data, error } = await supabaseAdmin
                .from('applications')
                .select('*')
                .eq('organization_name', org.name)
                // .in('status', ['pending', 'rejected']) // Removing status filter entirely to just get the latest interaction
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error || !data) {
                // Return specific error to UI so it knows manual intervention might be needed
                return NextResponse.json({ error: 'No application record found for this organization.' }, { status: 404 });
            }
            application = data;
        } else {
            return NextResponse.json({ error: 'Application ID or Org ID is required' }, { status: 400 });
        }

        if (application.status === 'approved') {
            return NextResponse.json({ message: 'Application is already approved' });
        }

        const orgName = application.organization_name;
        const applicantEmail = application.applicant_email;
        let orgId = application.details?.organization_id;

        // 2. Find Pending Organization (if ID not linked directly)
        if (!orgId) {
            const { data: pendingOrg } = await supabaseAdmin
                .from('organizations')
                .select('id')
                .eq('name', orgName)
                .single(); // Removed .eq('status', 'pending') to be safe if already partial logic ran

            orgId = pendingOrg?.id;
        }

        if (!orgId) {
            return NextResponse.json({ error: `Organization '${orgName}' not found in database.` }, { status: 404 });
        }

        // 3. Update Organization -> approved
        const { error: orgUpdateError } = await supabaseAdmin
            .from('organizations')
            .update({ status: 'approved' })
            .eq('id', orgId);

        if (orgUpdateError) throw orgUpdateError;

        // 4. Update User -> approved & org_admin & linked
        // Find user first
        const { data: user } = await supabaseAdmin
            .from('users')
            .select('id, role')
            .eq('email', applicantEmail)
            .single();

        if (user) {
            const { error: userUpdateError } = await supabaseAdmin
                .from('users')
                .update({
                    status: 'approved',
                    role: 'org_admin', // Enforce role
                    organization_id: orgId
                })
                .eq('id', user.id);

            if (userUpdateError) throw userUpdateError;

            // Ensure Organization Admin entry exists
            const { error: linkError } = await supabaseAdmin
                .from('organization_admins')
                .upsert({
                    organization_id: orgId,
                    user_id: user.id
                }, { onConflict: 'organization_id, user_id' }); // Ignore if exists
        }

        // 5. Update Application -> approved
        await supabaseAdmin
            .from('applications')
            .update({
                status: 'approved',
                reviewed_by: adminId || null
            })
            .eq('id', application_id);

        // 6. Audit Log
        if (adminId) {
            await supabaseAdmin.from('audit_logs').insert({
                action: 'ORGANIZATION_APPROVED_API',
                target_resource: orgId,
                actor_id: adminId,
                details: { application_id, applicant_email }
            });
        }

        return NextResponse.json({ message: 'Organization and User approved successfully' });

    } catch (error: any) {
        console.error("Org Approval Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
