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

    // Verify user is active in DB to handle instant session termination for disabled users
    const userProfile = await db.getUser(userId);
    if (!userProfile || userProfile.status !== 'active') {
      return NextResponse.json({ error: 'Your account has been deactivated or disabled.' }, { status: 403 });
    }

    // Fetch all raw data in parallel for performance
    const [projects, drawings, approvals, tasks, siteLogs, activityLogs, users, projectMembers] = await Promise.all([
      db.getProjects(tenantId),
      db.getDrawings(tenantId),
      db.getApprovals(tenantId),
      db.getTasks(tenantId),
      db.getSiteLogs(tenantId),
      db.getActivityLogs(tenantId),
      db.getUsers(tenantId),
      db.getProjectMembers(tenantId),
    ]);

    // --- Shared lookups ---
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));
    const drawingMap = Object.fromEntries(drawings.map(d => [d.id, d]));

    // ── ADMIN aggregations ───────────────────────────────────────────────────
    const activeProjects    = projects.filter(p => p.status === 'active');
    const completedProjects = projects.filter(p => p.status === 'completed');
    const pendingApprovals  = approvals.filter(a => a.status === 'pending');
    const openTasks         = tasks.filter(t => t.status !== 'completed');
    const overdueTasks      = tasks.filter(
      t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < now
    );

    // ── ARCHITECT aggregations ───────────────────────────────────────────────
    // Include projects created by the user, where they appear in project_members, or where they have an assigned task
    const memberProjectIds = new Set(
      projectMembers.filter(m => m.user_id === userId).map(m => m.project_id)
    );
    const taskProjectIds = new Set(
      tasks.filter(t => t.assigned_to === userId).map(t => t.project_id)
    );
    const myProjects           = projects.filter(
      p => p.created_by === userId || memberProjectIds.has(p.id) || taskProjectIds.has(p.id)
    );
    const myTasks              = tasks.filter(t => t.assigned_to === userId && t.status !== 'completed');
    const myDrawings           = drawings.filter(d => d.uploaded_by === userId);
    const mySubmittedApprovals = approvals.filter(a => a.submitted_by === userId && a.status === 'pending');
    const recentMyDrawings     = myDrawings
      .filter(d => new Date(d.created_at) >= oneWeekAgo)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
    const myOverdueTasks = overdueTasks.filter(t => t.assigned_to === userId);

    // ── CLIENT aggregations ──────────────────────────────────────────────────
    let clientEmail = '';
    const clientUser = userMap[userId];
    if (clientUser) {
      clientEmail = clientUser.email || '';
    } else {
      const directUser = await db.getUser(userId);
      if (directUser) {
        clientEmail = directUser.email || '';
      }
    }

    const clientProjects          = projects.filter(p => (clientEmail && p.client_email === clientEmail) || memberProjectIds.has(p.id));
    const clientProjectIds        = new Set(clientProjects.map(p => p.id));
    const clientApprovalsPending  = approvals.filter(a => a.client_id === userId && a.status === 'pending');
    const clientApprovalsApproved = approvals.filter(a => a.client_id === userId && a.status === 'approved');

    // Helper mappings to resolve parent project IDs for drawings, tasks, site logs, approvals
    const drawingProjMap = Object.fromEntries(drawings.map(d => [d.id, d.project_id]));
    const taskProjMap = Object.fromEntries(tasks.map(t => [t.id, t.project_id]));
    const siteLogProjMap = Object.fromEntries(siteLogs.map(s => [s.id, s.project_id]));
    const approvalProjMap = Object.fromEntries(approvals.map(a => {
      const drawing = drawingMap[a.drawing_id];
      return [a.id, drawing ? drawing.project_id : null];
    }));

    const getLogProjectId = (log) => {
      if (log.entity_type === 'project') return log.entity_id;
      if (log.entity_type === 'drawing') return drawingProjMap[log.entity_id] || null;
      if (log.entity_type === 'task') return taskProjMap[log.entity_id] || null;
      if (log.entity_type === 'site_log') return siteLogProjMap[log.entity_id] || null;
      if (log.entity_type === 'approval') return approvalProjMap[log.entity_id] || null;
      return null;
    };

    // ── KPIs per role ────────────────────────────────────────────────────────
    let kpis = {};
    if (role === 'admin') {
      kpis = {
        activeProjects:    activeProjects.length,
        completedProjects: completedProjects.length,
        pendingApprovals:  pendingApprovals.length,
        totalUsers:        users.length,
        openTasks:         openTasks.length,
        overdueTasks:      overdueTasks.length,
        siteLogs:          siteLogs.length,
        drawings:          drawings.length,
      };
    } else if (role === 'architect' || role === 'staff') {
      kpis = {
        assignedProjects:         myProjects.length,
        pendingTasks:             myTasks.length,
        recentDrawings:           recentMyDrawings.length,
        pendingApprovalResponses: mySubmittedApprovals.length,
        overdueTasks:             myOverdueTasks.length,
      };
    } else if (role === 'client') {
      const clientWeeklyActivity = activityLogs.filter(l => {
        const pId = getLogProjectId(l);
        return pId && clientProjectIds.has(pId) && new Date(l.created_at) >= oneWeekAgo;
      });
      kpis = {
        myProjects:    clientProjects.length,
        pendingReview: clientApprovalsPending.length,
        approved:      clientApprovalsApproved.length,
        unreadUpdates: clientWeeklyActivity.length,
      };
    }

    // ── Recent Activity ──────────────────────────────────────────────────────
    // For clients: scope to their project events only
    const activitySource = role === 'client'
      ? activityLogs.filter(l => {
          const pId = getLogProjectId(l);
          return pId && clientProjectIds.has(pId);
        })
      : activityLogs;

    const recentActivity = activitySource.slice(0, 10).map(log => {
      const pId = getLogProjectId(log);
      return {
        ...log,
        user_name: userMap[log.user_id]?.name || 'Unknown User',
        user_role: userMap[log.user_id]?.role || '',
        project_name: projects.find(p => p.id === pId)?.name || '',
      };
    });

    // ── Client Recent Updates feed ───────────────────────────────────────────
    const clientRecentUpdates = activityLogs
      .filter(l => {
        const pId = getLogProjectId(l);
        return pId && clientProjectIds.has(pId);
      })
      .slice(0, 8)
      .map(log => {
        const pId = getLogProjectId(log);
        return {
          ...log,
          user_name:    userMap[log.user_id]?.name || 'Unknown User',
          user_role:    userMap[log.user_id]?.role || '',
          project_name: projects.find(p => p.id === pId)?.name || '',
        };
      });

    // ── Upcoming Deadlines ───────────────────────────────────────────────────
    const deadlineSource = role === 'architect' || role === 'staff'
      ? tasks.filter(t => t.assigned_to === userId)
      : tasks;
    const upcomingDeadlines = deadlineSource
      .filter(t => t.status !== 'completed' && t.due_date)
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 5);

    // ── Pending Approval Items (enriched) ────────────────────────────────────
    const pendingApprovalItems = (role === 'client' ? clientApprovalsPending : pendingApprovals)
      .slice(0, 5)
      .map(a => ({
        ...a,
        drawing_name:     drawingMap[a.drawing_id]?.name || 'Drawing',
        drawing_number:   drawingMap[a.drawing_id]?.drawing_number || '',
        drawing_revision: drawingMap[a.drawing_id]?.current_revision || 1,
      }));

    // ── Recent Drawings ──────────────────────────────────────────────────────
    const recentDrawings = drawings
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(d => ({
        ...d,
        project_name:  projects.find(p => p.id === d.project_id)?.name || '',
        uploader_name: userMap[d.uploaded_by]?.name || '',
      }));

    // ── Project Status Breakdown (admin) ─────────────────────────────────────
    const projectStatusBreakdown = {
      planning:  projects.filter(p => p.status === 'planning').length,
      active:    projects.filter(p => p.status === 'active').length,
      on_hold:   projects.filter(p => p.status === 'on_hold').length,
      completed: projects.filter(p => p.status === 'completed').length,
      cancelled: projects.filter(p => p.status === 'cancelled').length,
    };

    // ── Client Project Timeline ──────────────────────────────────────────────
    const clientProjectTimeline = clientProjects.map(p => ({
      id:          p.id,
      name:        p.name,
      status:      p.status,
      start_date:  p.start_date,
      end_date:    p.end_date,
      client_name: p.client_name,
    }));

    // ── Architect: my submitted approvals (enriched) ─────────────────────────
    const mySubmittedApprovalItems = mySubmittedApprovals.slice(0, 5).map(a => ({
      ...a,
      drawing_name:     drawingMap[a.drawing_id]?.name || 'Drawing',
      drawing_revision: drawingMap[a.drawing_id]?.current_revision || 1,
    }));

    return NextResponse.json({
      kpis,
      recentActivity,
      upcomingDeadlines,
      pendingApprovalItems,
      recentDrawings,
      projectStatusBreakdown,
      // Architect-specific
      myTasks: role === 'architect' || role === 'staff'
        ? myTasks.slice(0, 6).map(t => ({
            ...t,
            project_name: projects.find(p => p.id === t.project_id)?.name || '',
          }))
        : [],
      myRecentDrawings: role === 'architect' || role === 'staff'
        ? myDrawings
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 6)
            .map(d => ({
              ...d,
              project_name: projects.find(p => p.id === d.project_id)?.name || '',
            }))
        : [],
      mySubmittedApprovalItems,
      // Client-specific
      clientProjects: clientProjectTimeline,
      clientApprovalsPending: role === 'client'
        ? clientApprovalsPending.slice(0, 5).map(a => ({
            ...a,
            drawing_name:     drawingMap[a.drawing_id]?.name || 'Drawing',
            drawing_number:   drawingMap[a.drawing_id]?.drawing_number || '',
            drawing_revision: drawingMap[a.drawing_id]?.current_revision || 1,
          }))
        : [],
      clientRecentUpdates,
    });
  } catch (error) {
    console.error('Dashboard Stats API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
