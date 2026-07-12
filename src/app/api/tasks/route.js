import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { logActivity } from '@/backend/services/activity';
import { createNotification } from '@/backend/services/notificationHelper';
import { getAuthContext } from '@/backend/utils/auth';
import { createTaskSchema } from '@/backend/utils/validation';

export async function GET(request) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId, userId, role } = auth;
    if (role === 'client') {
      return NextResponse.json({ tasks: [] });
    }
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const allowedIds = await db.getAllowedProjectIds(tenantId, userId, role);
    if (projectId && !allowedIds.includes(projectId)) {
      return NextResponse.json({ tasks: [] });
    }

    const tasks = await db.getTasks(tenantId, projectId);
    const filteredTasks = tasks.filter(t => allowedIds.includes(t.project_id));
    return NextResponse.json({ tasks: filteredTasks });
  } catch (error) {
    console.error('Get Tasks API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId, userId, role } = auth;
    if (role === 'client') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createTaskSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map(e => e.message).join(' ');
      return NextResponse.json({ error: errorMsg, details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { project_id, title, description, assigned_to, priority, due_date } = validation.data;

    // Verify project belongs to tenant
    const project = await db.getProject(project_id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
    }
    if (project.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Project belongs to another tenant.' }, { status: 403 });
    }

    // Verify assigned user belongs to tenant (if provided)
    if (assigned_to) {
      const assignee = await db.getUser(assigned_to);
      if (!assignee || assignee.tenant_id !== tenantId) {
        return NextResponse.json({ error: 'Unauthorized: Assigned user belongs to another tenant.' }, { status: 403 });
      }
    }

    const newTask = await db.createTask({
      project_id,
      tenant_id: tenantId,
      title,
      description,
      assigned_to: assigned_to || null,
      priority,
      status: 'pending',
      due_date
    });

    // Log activity
    const actionName = assigned_to ? 'Task Assigned' : 'Task Created';
    await logActivity(tenantId, userId, 'task', newTask.id, actionName, {
      taskTitle: title,
      assignedTo: assigned_to || null
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
