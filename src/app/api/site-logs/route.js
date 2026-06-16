import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { logActivity } from '@/backend/services/activity';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const headerTenantId = request.headers.get('x-tenant-id');
    const tenantId = headerTenantId || searchParams.get('tenantId') || 't1';
    const projectId = searchParams.get('projectId');

    const siteLogs = await db.getSiteLogs(tenantId, projectId);
    return NextResponse.json({ siteLogs });
  } catch (error) {
    console.error('Get Site Logs API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const headerTenantId = request.headers.get('x-tenant-id');
    const headerUserId = request.headers.get('x-user-id');

    const body = await request.json();
    const tenantId = headerTenantId || body.tenant_id || 't1';
    const userId = headerUserId || body.created_by || 'u3'; // default to staff

    const { project_id, notes, photos } = body;

    if (!project_id || !notes) {
      return NextResponse.json({ error: 'Project ID and notes are required.' }, { status: 400 });
    }

    const photoUrls = photos || [];

    const newLog = await db.createSiteLog({
      project_id,
      tenant_id: tenantId,
      notes,
      created_by: userId
    }, photoUrls);

    // Log the site log creation
    const project = await db.getProject(project_id);
    await logActivity(tenantId, userId, 'site_log', newLog.id, 'Site Log Created', {
      projectName: project ? project.name : 'Unknown Project',
      photoCount: photoUrls.length
    });

    return NextResponse.json({ message: 'Site log created successfully', siteLog: newLog });
  } catch (error) {
    console.error('Create Site Log API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
