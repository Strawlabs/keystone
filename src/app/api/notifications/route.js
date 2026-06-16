import { NextResponse } from 'next/server';
import { db } from '@/backend/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const headerTenantId = request.headers.get('x-tenant-id');
    const headerUserId = request.headers.get('x-user-id');

    const tenantId = headerTenantId || searchParams.get('tenantId') || 't1';
    const userId = headerUserId || searchParams.get('userId') || 'u1';

    const notifications = await db.getNotifications(tenantId, userId);
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Get Notifications API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required.' }, { status: 400 });
    }

    const updatedNotif = await db.markNotificationRead(id);
    if (!updatedNotif) {
      return NextResponse.json({ error: 'Notification not found.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Notification marked as read', notification: updatedNotif });
  } catch (error) {
    console.error('Update Notification API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
