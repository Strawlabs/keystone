import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { getAuthContext } from '@/backend/utils/auth';
import { logActivity } from '@/backend/services/activity';

export async function GET(request, { params }) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId } = auth;
    const { id: projectId } = await params;

    // Verify project belongs to tenant
    const project = await db.getProject(projectId);
    if (!project || project.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
    }

    const members = await db.getProjectMembersByProject(projectId);
    return NextResponse.json({ members });
  } catch (error) {
    console.error('Get Project Members API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId, userId: currentUserId, role: currentUserRole } = auth;
    const { id: projectId } = await params;

    // Only admin and architect can assign members
    if (currentUserRole !== 'admin' && currentUserRole !== 'architect') {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // Verify project belongs to tenant
    const project = await db.getProject(projectId);
    if (!project || project.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const { user_id, role } = body;

    if (!user_id || !role) {
      return NextResponse.json({ error: 'Missing required fields: user_id, role' }, { status: 400 });
    }

    // Verify target user belongs to tenant
    const targetUser = await db.getUser(user_id);
    if (!targetUser || targetUser.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Target user not found or unauthorized' }, { status: 400 });
    }

    const member = await db.addProjectMember({
      project_id: projectId,
      user_id,
      role
    });

    // Log activity
    await logActivity(tenantId, currentUserId, 'project', projectId, 'Project Member Added', {
      projectName: project.name,
      addedUserName: targetUser.name,
      addedUserRole: role
    });

    return NextResponse.json({ message: 'Project member added successfully', member }, { status: 201 });
  } catch (error) {
    console.error('Add Project Member API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId, userId: currentUserId, role: currentUserRole } = auth;
    const { id: projectId } = await params;

    // Only admin and architect can remove members
    if (currentUserRole !== 'admin' && currentUserRole !== 'architect') {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }

    // Verify project belongs to tenant
    const project = await db.getProject(projectId);
    if (!project || project.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing required query parameter: userId' }, { status: 400 });
    }

    // Verify user profile to log name
    const targetUser = await db.getUser(userId);

    await db.removeProjectMember(projectId, userId);

    // Log activity
    await logActivity(tenantId, currentUserId, 'project', projectId, 'Project Member Removed', {
      projectName: project.name,
      removedUserName: targetUser ? targetUser.name : 'Unknown User'
    });

    return NextResponse.json({ message: 'Project member removed successfully' });
  } catch (error) {
    console.error('Remove Project Member API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
