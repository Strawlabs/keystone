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
    let activityLogs = await db.getActivityLogs(tenantId);

    if (projectId) {
      if (role !== 'admin' && !allowedIds.includes(projectId)) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
      }

      const [drawings, tasks, siteLogs, approvals] = await Promise.all([
        db.getDrawings(tenantId, projectId),
        db.getTasks(tenantId, projectId),
        db.getSiteLogs(tenantId, projectId),
        db.getApprovals(tenantId)
      ]);
      const drawingIds = new Set((drawings || []).map(d => d.id));
      const taskIds = new Set((tasks || []).map(t => t.id));
      const siteLogIds = new Set((siteLogs || []).map(s => s.id));
      const approvalIds = new Set(
        (approvals || [])
          .filter(a => a.drawings && a.drawings.project_id === projectId)
          .map(a => a.id)
      );

      activityLogs = activityLogs.filter(log => {
        if (log.entity_id === projectId) return true;
        if (log.metadata?.projectId === projectId || log.metadata?.project_id === projectId) return true;
        if (log.entity_type === 'drawing' && drawingIds.has(log.entity_id)) return true;
        if (log.entity_type === 'task' && taskIds.has(log.entity_id)) return true;
        if (log.entity_type === 'site_log' && siteLogIds.has(log.entity_id)) return true;
        if (log.entity_type === 'approval' && approvalIds.has(log.entity_id)) return true;
        return false;
      });

      return NextResponse.json({ activityLogs });
    }

    // Global feed request
    if (role !== 'admin') {
      const [drawings, tasks, siteLogs, approvals] = await Promise.all([
        db.getDrawings(tenantId),
        db.getTasks(tenantId),
        db.getSiteLogs(tenantId),
        db.getApprovals(tenantId)
      ]);
      const allowedSet = new Set(allowedIds);
      const allowedDrawingIds = new Set((drawings || []).filter(d => allowedSet.has(d.project_id)).map(d => d.id));
      const allowedTaskIds = new Set((tasks || []).filter(t => allowedSet.has(t.project_id)).map(t => t.id));
      const allowedSiteLogIds = new Set((siteLogs || []).filter(s => allowedSet.has(s.project_id)).map(s => s.id));
      const allowedApprovalIds = new Set(
        (approvals || []).filter(a => a.drawings && allowedSet.has(a.drawings.project_id)).map(a => a.id)
      );

      activityLogs = activityLogs.filter(log => {
        if (log.user_id === userId) return true;
        if (log.entity_id && allowedSet.has(log.entity_id)) return true;
        if (log.metadata?.projectId && allowedSet.has(log.metadata.projectId)) return true;
        if (log.entity_type === 'drawing' && allowedDrawingIds.has(log.entity_id)) return true;
        if (log.entity_type === 'task' && allowedTaskIds.has(log.entity_id)) return true;
        if (log.entity_type === 'site_log' && allowedSiteLogIds.has(log.entity_id)) return true;
        if (log.entity_type === 'approval' && allowedApprovalIds.has(log.entity_id)) return true;
        return false;
      });
    }

    return NextResponse.json({ activityLogs });
  } catch (error) {
    console.error('Get Activity Logs API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
