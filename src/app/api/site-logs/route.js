import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { logActivity } from '@/backend/services/activity';
import { getAuthContext } from '@/backend/utils/auth';
import { createSiteLogSchema } from '@/backend/utils/validation';

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
    if (projectId && !allowedIds.includes(projectId)) {
      return NextResponse.json({ siteLogs: [] });
    }

    const siteLogs = await db.getSiteLogs(tenantId, projectId);
    const filteredLogs = siteLogs.filter(s => allowedIds.includes(s.project_id));
    return NextResponse.json({ siteLogs: filteredLogs });
  } catch (error) {
    console.error('Get Site Logs API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId, userId } = auth;

    const body = await request.json();
    const validation = createSiteLogSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map(e => e.message).join(' ');
      return NextResponse.json({ error: errorMsg, details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { project_id, notes, photos } = body;

    // Verify project belongs to tenant
    const project = await db.getProject(project_id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }
    if (project.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Project belongs to another tenant.' }, { status: 403 });
    }

    const photoUrls = photos || [];

    const newLog = await db.createSiteLog({
      project_id,
      tenant_id: tenantId,
      notes,
      created_by: userId
    }, photoUrls);

    // Log the site log creation
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
