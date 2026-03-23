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
        const { training_standard_id, location, start_date, end_date, status, adminId, max_participants, delivery_mode } = body;

        if (!training_standard_id || !start_date || !end_date) 
            return NextResponse.json({ error: 'Missing required session fields' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('sessions')
            .insert({
                training_standard_id,
                location,
                start_date: new Date(start_date).toISOString(),
                end_date: new Date(end_date).toISOString(),
                status: status || 'planned',
                max_participants: max_participants || 15,
                delivery_mode: delivery_mode || 'onsite'
            })
            .select().single();

        if (error) throw error;

        if (adminId) {
            await supabaseAdmin.from('audit_logs').insert({
                action: 'SESSION_CREATED',
                actor_id: adminId,
                entity_type: 'session',
                entity_id: data.id
            });
        }

        return NextResponse.json({ message: 'Session created', session: data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, training_standard_id, location, start_date, end_date, status, adminId, max_participants, delivery_mode } = body;

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const updateData: any = { location, status };
        if (training_standard_id) updateData.training_standard_id = training_standard_id;
        if (start_date) updateData.start_date = new Date(start_date).toISOString();
        if (end_date) updateData.end_date = new Date(end_date).toISOString();
        if (max_participants !== undefined) updateData.max_participants = max_participants;
        if (delivery_mode) updateData.delivery_mode = delivery_mode;

        const { data, error } = await supabaseAdmin
            .from('sessions')
            .update(updateData)
            .eq('id', id)
            .select().single();

        if (error) throw error;

        if (adminId) {
            await supabaseAdmin.from('audit_logs').insert({
                action: 'SESSION_UPDATED',
                actor_id: adminId,
                entity_type: 'session',
                entity_id: id
            });
        }

        return NextResponse.json({ message: 'Session updated', session: data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const adminId = searchParams.get('adminId');

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const { error } = await supabaseAdmin.from('sessions').delete().eq('id', id);
        if (error) throw error;

        if (adminId) {
            await supabaseAdmin.from('audit_logs').insert({
                action: 'SESSION_DELETED',
                actor_id: adminId,
                entity_type: 'session',
                entity_id: id
            });
        }

        return NextResponse.json({ message: 'Session deleted' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}