import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { getAuthContext } from '@/backend/utils/auth';
import { supabase } from '@/backend/db/client';

export async function GET(request) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId, userId } = auth;

    const notifications = await db.getNotifications(tenantId, userId);
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Get Notifications API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId, userId } = auth;

    const body = await request.json().catch(() => ({}));
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required.' }, { status: 400 });
    }

    // Verify notification belongs to the tenant and user
    const { data: notif, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !notif) {
      return NextResponse.json({ error: 'Notification not found.' }, { status: 404 });
    }

    if (notif.tenant_id !== tenantId || notif.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedNotif = await db.markNotificationRead(id);
    return NextResponse.json({ message: 'Notification marked as read', notification: updatedNotif });
  } catch (error) {
    console.error('Update Notification API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
