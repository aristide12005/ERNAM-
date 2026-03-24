import { NextResponse, NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { hasPermission } from '@/lib/rbac-server';

async function getAdminUser(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return null;
    const token = authHeader.replace('Bearer ', '');
    const supabaseAdmin = getSupabaseAdmin();
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    return user;
}

export async function POST(req: NextRequest) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        const adminUser = await getAdminUser(req);
        if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const adminId = adminUser.id;

        const body = await req.json();
        const { code, title, description, validity_months, active } = body;

        // RBAC Enforcement
        if (!await hasPermission(adminId, 'sessions', 'create')) {
            return NextResponse.json({ error: 'Forbidden: Insufficient permissions to create standards' }, { status: 403 });
        }

        if (!code || !title) return NextResponse.json({ error: 'Code and Title are required' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('training_standards')
            .insert({ code: code.toUpperCase(), title, description, validity_months: Number(validity_months), active })
            .select().single();

        if (error) {
            if (error.code === '23505') return NextResponse.json({ error: 'A standard with this code already exists.' }, { status: 409 });
            throw error;
        }

        if (adminId) {
            await supabaseAdmin.from('audit_logs').insert({
                action: 'STANDARD_CREATED',
                actor_id: adminId,
                entity_type: 'standard',
                entity_id: data.id
            });
        }

        return NextResponse.json({ message: 'Standard created', standard: data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const adminUser = await getAdminUser(req);
        if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const adminId = adminUser.id;

        const body = await req.json();
        const { id, code, title, description, validity_months, active } = body;

        // RBAC Enforcement
        if (!await hasPermission(adminId, 'sessions', 'edit')) {
            return NextResponse.json({ error: 'Forbidden: Insufficient permissions to edit standards' }, { status: 403 });
        }

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const { data, error } = await supabaseAdmin
            .from('training_standards')
            .update({ code: code?.toUpperCase(), title, description, validity_months: Number(validity_months), active })
            .eq('id', id)
            .select().single();

        if (error) throw error;

        if (adminId) {
            await supabaseAdmin.from('audit_logs').insert({
                action: 'STANDARD_UPDATED',
                actor_id: adminId,
                entity_type: 'standard',
                entity_id: id
            });
        }

        return NextResponse.json({ message: 'Standard updated', standard: data });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const adminUser = await getAdminUser(req);
        if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const adminId = adminUser.id;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        // RBAC Enforcement
        if (!await hasPermission(adminId, 'sessions', 'delete')) {
            return NextResponse.json({ error: 'Forbidden: Insufficient permissions to delete standards' }, { status: 403 });
        }

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const { error } = await supabaseAdmin.from('training_standards').delete().eq('id', id);
        if (error) throw error;

        if (adminId) {
            await supabaseAdmin.from('audit_logs').insert({
                action: 'STANDARD_DELETED',
                actor_id: adminId,
                entity_type: 'standard',
                entity_id: id
            });
        }

        return NextResponse.json({ message: 'Standard deleted' });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}