import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { logActivity } from '@/backend/services/activity';
import { createNotification } from '@/backend/services/notificationHelper';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const headerTenantId = request.headers.get('x-tenant-id');
    const tenantId = headerTenantId || searchParams.get('tenantId') || 't1';
    const projectId = searchParams.get('projectId');

    const drawings = await db.getDrawings(tenantId, projectId);
    return NextResponse.json({ drawings });
  } catch (error) {
    console.error('Get Drawings API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const headerTenantId = request.headers.get('x-tenant-id');
    const headerUserId = request.headers.get('x-user-id');
    
    const body = await request.json();
    const tenantId = headerTenantId || body.tenant_id || 't1';
    const userId = headerUserId || body.uploaded_by || 'u2'; // default to architect user

    const { project_id, name, category, file_url, revision_notes } = body;

    if (!project_id || !name || !category || !file_url) {
      return NextResponse.json({ error: 'Project ID, drawing name, category, and file URL are required.' }, { status: 400 });
    }

    const newDrawing = await db.createDrawing({
      project_id,
      tenant_id: tenantId,
      name,
      category,
      file_url,
      uploaded_by: userId
    }, revision_notes || 'Initial drawing upload.');

    // Log drawing creation
    await logActivity(tenantId, userId, 'drawing', newDrawing.id, 'Drawing Uploaded', {
      drawingName: name,
      category
    });

    // Notify Admins and Clients assigned to this project
    const project = await db.getProject(project_id);
    const users = await db.getUsers(tenantId);
    
    // Notify admin
    const adminUser = users.find(u => u.role === 'admin');
    if (adminUser) {
      await createNotification(
        tenantId,
        adminUser.id,
        'New Drawing Uploaded',
        `A new drawing "${name}" was uploaded by an architect for project "${project.name}".`,
        'drawing_uploaded'
      );
    }

    return NextResponse.json({ message: 'Drawing uploaded successfully', drawing: newDrawing });
  } catch (error) {
    console.error('Upload Drawing API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
