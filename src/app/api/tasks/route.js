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

    const tasks = await db.getTasks(tenantId, projectId);
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Get Tasks API Error:', error);
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

    const { project_id, title, description, assigned_to, priority, due_date } = body;

    if (!project_id || !title || !priority) {
      return NextResponse.json({ error: 'Project ID, task title, and priority are required.' }, { status: 400 });
    }

    const newTask = await db.createTask({
      project_id,
      tenant_id: tenantId,
      title,
      description,
      assigned_to,
      priority,
      status: 'pending',
      due_date
    });

    // Log activity
    await logActivity(tenantId, userId, 'task', newTask.id, 'Task Assigned', {
      taskTitle: title,
      assignedTo: assigned_to
    });

    // Notify assignee
    if (assigned_to) {
      await createNotification(
        tenantId,
        assigned_to,
        'New Task Assigned',
        `You have been assigned a new task: "${title}". Due: ${due_date || 'No due date'}.`,
        'task_assigned'
      );
    }

    return NextResponse.json({ message: 'Task created successfully', task: newTask });
  } catch (error) {
    console.error('Create Task API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
