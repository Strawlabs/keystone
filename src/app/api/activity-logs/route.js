import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { getAuthContext } from '@/backend/utils/auth';

export async function GET(request) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId, userId, role } = auth;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const allowedIds = await db.getAllowedProjectIds(tenantId, userId, role);

    if (projectId) {
      if (!allowedIds.includes(projectId)) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
      }
      let activityLogs = await db.getActivityLogs(tenantId);
      activityLogs = activityLogs.filter(log => log.entity_id === projectId);
      return NextResponse.json({ activityLogs });
    }

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    const activityLogs = await db.getActivityLogs(tenantId);
    return NextResponse.json({ activityLogs });
  } catch (error) {
    console.error('Get Activity Logs API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
