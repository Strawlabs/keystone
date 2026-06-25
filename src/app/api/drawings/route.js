import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { logActivity } from '@/backend/services/activity';
import { createNotification } from '@/backend/services/notificationHelper';
import { getAuthContext } from '@/backend/utils/auth';
import { createDrawingSchema } from '@/backend/utils/validation';

export async function GET(request) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId } = auth;
    const { searchParams } = new URL(request.url);
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
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId, userId } = auth;
    
    const body = await request.json();
    const validation = createDrawingSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map(e => e.message).join(' ');
      return NextResponse.json({ error: errorMsg, details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { project_id, name, category, file_url, revision_notes } = body;

    // Cross-tenant verification: Ensure the project exists and belongs to the authenticated user's tenant
    const project = await db.getProject(project_id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }
    if (project.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Project belongs to another tenant.' }, { status: 403 });
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
