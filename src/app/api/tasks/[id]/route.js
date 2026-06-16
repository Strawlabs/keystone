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

    const { title, description, assigned_to, priority, status, due_date } = body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.status = status;
    if (due_date !== undefined) updates.due_date = due_date;

    const updatedTask = await db.updateTask(id, updates);

    // Log update
    await logActivity(tenantId, userId, 'task', id, 'Task Updated', {
      taskTitle: updatedTask.title,
      status: updatedTask.status
    });

    return NextResponse.json({ message: 'Task updated successfully', task: updatedTask });
  } catch (error) {
    console.error('Update Task API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
