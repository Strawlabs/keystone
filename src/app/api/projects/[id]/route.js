import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { logActivity } from '@/backend/services/activity';
import { getAuthContext } from '@/backend/utils/auth';
import { updateProjectSchema } from '@/backend/utils/validation';

export async function PUT(request, { params }) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId, userId } = auth;
    const { id } = await params;

    const project = await db.getProject(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    if (project.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant mismatch' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateProjectSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map(e => e.message).join(' ');
      return NextResponse.json({ error: errorMsg, details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, client_name, client_email, location, description, status, start_date, end_date } = validation.data;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (client_name !== undefined) updates.client_name = client_name;
    if (client_email !== undefined) updates.client_email = client_email;
    if (location !== undefined) updates.location = location;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (start_date !== undefined) updates.start_date = start_date;
    if (end_date !== undefined) updates.end_date = end_date;

    const updatedProject = await db.updateProject(id, updates);

    // If status changed, record it in the activity log
    if (status && status !== project.status) {
      await logActivity(tenantId, userId, 'project', id, 'Project Status Changed', {
        projectName: project.name,
        oldStatus: project.status,
        newStatus: status
      });
    } else {
      await logActivity(tenantId, userId, 'project', id, 'Project Updated', {
        projectName: project.name
      });
    }

    return NextResponse.json({ message: 'Project updated successfully', project: updatedProject });
  } catch (error) {
    console.error('Update Project API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId, userId } = auth;
    const { id } = await params;

    const project = await db.getProject(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    if (project.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant mismatch' }, { status: 403 });
    }

    await db.deleteProject(id);

    // Log deletion
    await logActivity(tenantId, userId, 'project', id, 'Project Archived', {
      projectName: project.name,
      projectCode: project.code
    });

    return NextResponse.json({ message: 'Project archived successfully.' });
  } catch (error) {
    console.error('Archive Project API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
