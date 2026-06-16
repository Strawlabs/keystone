import { NextResponse } from 'next/server';
import { db } from '@/backend/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const headerTenantId = request.headers.get('x-tenant-id');
    const tenantId = headerTenantId || searchParams.get('tenantId') || 't1';

    const activityLogs = await db.getActivityLogs(tenantId);
    return NextResponse.json({ activityLogs });
  } catch (error) {
    console.error('Get Activity Logs API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
