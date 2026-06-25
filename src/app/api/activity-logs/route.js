import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { getAuthContext } from '@/backend/utils/auth';

export async function GET(request) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId } = auth;

    const activityLogs = await db.getActivityLogs(tenantId);
    return NextResponse.json({ activityLogs });
  } catch (error) {
    console.error('Get Activity Logs API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
