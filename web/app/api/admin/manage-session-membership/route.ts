
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
        const { type, session_id, user_id, action, adminId } = body; // type: 'instructor' | 'participant', action: 'add' | 'remove'

        if (!type || !session_id || !user_id || !action) 
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

        const table = type === 'instructor' ? 'session_instructors' : 'session_participants';
        const idField = type === 'instructor' ? 'instructor_id' : 'participant_id';

        if (action === 'add') {
            const payload: any = { session_id };
            payload[idField] = user_id;
            if (type === 'participant') payload.status = 'enrolled';

            const { data, error } = await supabaseAdmin.from(table).insert([payload]).select().single();
            if (error) throw error;

            if (adminId) {
                await supabaseAdmin.from('audit_logs').insert({
                    action: `${type.toUpperCase()}_ASSIGNED`,
                    target_resource: session_id,
                    actor_id: adminId,
                    entity_type: 'session',
                    entity_id: session_id,
                    details: { user_id }
                });
            }
            return NextResponse.json({ message: 'Added successfully', data });
        } else if (action === 'remove') {
            const { error } = await supabaseAdmin.from(table).delete().eq('session_id', session_id).eq(idField, user_id);
            if (error) throw error;

            if (adminId) {
                await supabaseAdmin.from('audit_logs').insert({
                    action: `${type.toUpperCase()}_REMOVED`,
                    target_resource: session_id,
                    actor_id: adminId,
                    entity_type: 'session',
                    entity_id: session_id,
                    details: { user_id }
                });
            }
            return NextResponse.json({ message: 'Removed successfully' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
