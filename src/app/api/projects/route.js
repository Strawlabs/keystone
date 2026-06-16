import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { logActivity } from '@/backend/services/activity';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const headerTenantId = request.headers.get('x-tenant-id');
    const tenantId = headerTenantId || searchParams.get('tenantId') || 't1'; // Fallback to 't1' default tenant

    const projects = await db.getProjects(tenantId);
    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Get Projects API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const headerTenantId = request.headers.get('x-tenant-id');
    const headerUserId = request.headers.get('x-user-id');
    
    const body = await request.json();
    const tenantId = headerTenantId || body.tenant_id || 't1';
    const userId = headerUserId || body.created_by || 'u1';

    const { name, code, client_name, client_email, location, description, status, start_date, end_date } = body;

    if (!name || !code || !client_name) {
      return NextResponse.json({ error: 'Project name, code, and client name are required.' }, { status: 400 });
    }

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

    return NextResponse.json({ message: 'Project created successfully', project: newProject }, { status: 212 });
  } catch (error) {
    console.error('Create Project API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
