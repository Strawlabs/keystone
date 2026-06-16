import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { logActivity } from '@/backend/services/activity';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const headerTenantId = request.headers.get('x-tenant-id');
    const headerUserId = request.headers.get('x-user-id');

    const body = await request.json();
    const tenantId = headerTenantId || body.tenant_id || 't1';
    const userId = headerUserId || body.user_id || 'u1';

    const project = await db.getProject(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }

    if (project.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant mismatch' }, { status: 403 });
    }

    const { name, client_name, client_email, location, description, status, start_date, end_date } = body;

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
    const { id } = await params;
    const headerTenantId = request.headers.get('x-tenant-id');
    const headerUserId = request.headers.get('x-user-id');
    
    const tenantId = headerTenantId || 't1';
    const userId = headerUserId || 'u1';

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
