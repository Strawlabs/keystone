import { NextResponse } from 'next/server';
import { db, supabase } from '@/backend/db/client';
import { getAuthContext } from '@/backend/utils/auth';
import { logActivity } from '@/backend/services/logger';

export async function PATCH(request, { params }) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
    const { tenantId, userId: adminId, role: adminRole } = auth;
    if (adminRole !== 'admin') return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });

    const { id: targetId } = await params;
    const targetUser = await db.getUser(targetId);
    if (!targetUser || targetUser.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const body = await request.json();
    const allowed = ['name', 'role', 'status'];
    const updates = {};
    for (const key of allowed) { if (body[key] !== undefined) updates[key] = body[key]; }
    if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No valid fields.' }, { status: 400 });

    const updated = await db.updateUser(targetId, updates);
    try { await logActivity(tenantId, adminId, 'auth', targetId, 'User Updated', updates); } catch (_) {}
    return NextResponse.json({ success: true, user: updated });
  } catch (error) {
    console.error('PATCH /api/users/[id]:', error);
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }
}

// DELETE /api/users/[id] — Admin only: soft-disable user (status=disabled + Auth ban)
export async function DELETE(request, { params }) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
    const { tenantId, userId: adminId, role: adminRole } = auth;
    if (adminRole !== 'admin') return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });

    const { id: targetId } = await params;
    if (targetId === adminId) {
      return NextResponse.json({ error: 'Cannot disable your own account.' }, { status: 400 });
    }

    const targetUser = await db.getUser(targetId);
    if (!targetUser || targetUser.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    await db.updateUser(targetId, { status: 'disabled' });
    // Ban from Supabase Auth so they cannot log in (non-fatal if it fails)
    try { await supabase.auth.admin.updateUserById(targetId, { ban_duration: '87600h' }); } catch (_) {}
    try { await logActivity(tenantId, adminId, 'auth', targetId, 'User Disabled', { email: targetUser.email }); } catch (_) {}
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/users/[id] Error:', error);
    return NextResponse.json({ error: 'Failed to disable user.' }, { status: 500 });
  }
}