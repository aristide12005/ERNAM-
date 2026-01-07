
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Client (Safe Fallback to prevent build crashes)
// NOTE: Admin features require SUPABASE_SERVICE_ROLE_KEY to be set in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.warn("Missing Supabase credentials in api/admin/create-standard");
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
        const { code, title, description, validity_months, active, adminId } = body;

        console.log(`[API] Create Standard: ${code}, Validity: ${validity_months}`);

        // 1. Basic Validation
        if (!code || !title) {
            return NextResponse.json({ error: 'Code and Title are required' }, { status: 400 });
        }

        // 2. Verify Admin Role (Optional but recommended)
        /* 
           Ideally, we pass the user's access token in headers and verify it:
           const authHeader = req.headers.get('Authorization');
           const { data: { user }, error } = await supabase.auth.getUser(token);
           ... check if user.role === 'ernam_admin' ...
           
           For now, assuming the route is protected by Middleware or Client checks + Trust,
           we proceed with the Service Role insert.
        */

        // 3. Create Standard
        const { data, error } = await supabaseAdmin
            .from('training_standards')
            .insert({
                code: code.toUpperCase(), // Ensure uppercase
                title,
                description,
                validity_months,
                active,
                details: {} // Default empty JSON
            })
            .select()
            .single();

        if (error) {
            // Handle unique constraint violations
            if (error.code === '23505') {
                return NextResponse.json({ error: 'A standard with this code already exists.' }, { status: 409 });
            }
            throw error;
        }

        // 4. Log Action (Optional audit)
        // 4. Log Action (Optional audit)
        if (adminId) {
            const { error: auditError } = await supabaseAdmin.from('audit_logs').insert({
                action: 'STANDARD_CREATED_API',
                target_resource: data.id,
                actor_id: adminId,
                details: { code, title }
            });

            if (auditError) {
                console.error("Audit Log Error:", auditError);
            }
        }

        return NextResponse.json({ message: 'Standard created successfully', standard: data });

    } catch (error: any) {
        console.error("Standard Creation Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
