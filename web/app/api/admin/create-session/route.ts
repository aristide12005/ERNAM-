
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Client (Safe Fallback)
// Admin features require SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn("Missing Supabase credentials in api/admin/create-session");
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
        const { training_standard_id, location, start_date, end_date, status, adminId } = body;

        // 1. Basic Validation
        if (!training_standard_id || !start_date || !end_date) {
            return NextResponse.json({ error: 'Missing required session fields' }, { status: 400 });
        }

        // 2. Create Session (Bypassing RLS)
        const { data, error } = await supabaseAdmin
            .from('sessions')
            .insert({
                training_standard_id,
                location,
                start_date,
                end_date,
                status: status || 'planned'
            })
            .select()
            .single();

        if (error) {
            throw error;
        }

        // 3. Log Action (Optional audit)
        if (adminId) {
            const { error: auditError } = await supabaseAdmin.from('audit_logs').insert({
                action: 'SESSION_CREATED_API',
                target_resource: data.id,
                admin_id: adminId,
                details: { training_standard_id, start_date }
            });

            if (auditError) {
                console.error("Audit Log Error:", auditError);
            }
        }

        return NextResponse.json({ message: 'Session created successfully', session: data });

    } catch (error: any) {
        console.error("Session Creation Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
