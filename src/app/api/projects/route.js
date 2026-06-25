import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { logActivity } from '@/backend/services/activity';
import { getAuthContext } from '@/backend/utils/auth';
import { createProjectSchema } from '@/backend/utils/validation';

export async function GET(request) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId } = auth;

    const projects = await db.getProjects(tenantId);
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Get Projects API Error:', error);
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
    const validation = createProjectSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map(e => e.message).join(' ');
      return NextResponse.json({ error: errorMsg, details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, code, client_name, client_email, location, description, status, start_date, end_date } = validation.data;

    // Check if project code already exists for this tenant
    const existingProjects = await db.getProjects(tenantId);
    if (existingProjects.some(p => p.code.toUpperCase() === code.toUpperCase())) {
      return NextResponse.json({ error: `Project code '${code}' already exists under this tenant.` }, { status: 400 });
    }

    const newProject = await db.createProject({
      tenant_id: tenantId,
      name,
      code,
      client_name,
      client_email,
      location,
      description,
      status: status || 'planning',
      start_date,
      end_date,
      created_by: userId
    });

    // Log project creation in audit trail
    await logActivity(tenantId, userId, 'project', newProject.id, 'Project Created', { 
      projectName: newProject.name,
      projectCode: newProject.code
    });

    return NextResponse.json({ message: 'Project created successfully', project: newProject }, { status: 201 });
  } catch (error) {
    console.error('Create Project API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
