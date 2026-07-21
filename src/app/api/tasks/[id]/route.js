import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { logActivity } from '@/backend/services/activity';
import { createNotification } from '@/backend/services/notificationHelper';
import { getAuthContext } from '@/backend/utils/auth';
import { updateTaskSchema } from '@/backend/utils/validation';

export async function PUT(request, { params }) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId, userId, role } = auth;
    const { id } = await params;

    // Verify task ownership under the caller's tenant
    const tasks = await db.getTasks(tenantId);
    const task = tasks.find(t => t.id === id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found or unauthorized.' }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateTaskSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map(e => e.message).join(' ');
      return NextResponse.json({ error: errorMsg, details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { title, description, assigned_to, priority, status, due_date } = validation.data;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to || null;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.status = status;
    if (due_date !== undefined) updates.due_date = due_date;

    const updatedTask = await db.updateTask(id, updates);

    // 1. Detect and Log custom activity events
    let loggedEvent = false;

    if (status && status !== task.status) {
      loggedEvent = true;
      if (status === 'completed') {
        await logActivity(tenantId, userId, 'task', id, 'Task Completed', {
          taskTitle: updatedTask.title,
          projectId: task.project_id
        });

        // Notify project admins
        const users = await db.getUsers(tenantId);
        const adminUser = users.find(u => u.role === 'admin');
        if (adminUser) {
          const completionUser = users.find(u => u.id === userId);
          await createNotification(
            tenantId,
            adminUser.id,
            'Task Completed',
            `${completionUser ? completionUser.name : 'A team member'} completed task: "${updatedTask.title}"`,
            'task_completed'
          );
        }
      } else if (status === 'delayed') {
        await logActivity(tenantId, userId, 'task', id, 'Task Delayed', {
          taskTitle: updatedTask.title,
          projectId: task.project_id
        });
      } else {
        await logActivity(tenantId, userId, 'task', id, 'Task Updated', {
          taskTitle: updatedTask.title,
          status: updatedTask.status,
          projectId: task.project_id
        });
      }
    }

    if (assigned_to && assigned_to !== task.assigned_to) {
      loggedEvent = true;
      await logActivity(tenantId, userId, 'task', id, 'Task Assigned', {
        taskTitle: updatedTask.title,
        assignedTo: assigned_to,
        projectId: task.project_id
      });

      // Notify new assignee
      await createNotification(
        tenantId,
        assigned_to,
        'New Task Assigned',
        `You have been assigned a task: "${updatedTask.title}". Due: ${updatedTask.due_date || 'No due date'}.`,
        'task_assigned'
      );
    }

    if (!loggedEvent) {
      await logActivity(tenantId, userId, 'task', id, 'Task Updated', {
        taskTitle: updatedTask.title,
        status: updatedTask.status,
        projectId: task.project_id
      });
    }

    return NextResponse.json({ message: 'Task updated successfully', task: updatedTask });
  } catch (error) {
    console.error('Update Task API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
