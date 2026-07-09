import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { logActivity } from '@/backend/services/activity';
import { createNotification } from '@/backend/services/notificationHelper';
import { getAuthContext } from '@/backend/utils/auth';

export async function POST(request, { params }) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId, userId, role } = auth;
    if (role === 'client') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }
    const { id } = await params;

    const task = await db.getTasks(tenantId);
    const targetTask = task.find(t => t.id === id);

    if (!targetTask) {
      return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
    }

    const updatedTask = await db.updateTask(id, { status: 'completed' });

    // Log the completion
    await logActivity(tenantId, userId, 'task', id, 'Task Completed', {
      taskTitle: targetTask.title
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
        `${completionUser ? completionUser.name : 'A team member'} completed task: "${targetTask.title}"`,
        'task_completed'
      );
    }

    return NextResponse.json({ message: 'Task marked as completed', task: updatedTask });
  } catch (error) {
    console.error('Complete Task API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
