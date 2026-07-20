import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { logActivity } from '@/backend/services/activity';
import { createNotification } from '@/backend/services/notificationHelper';
import { getAuthContext } from '@/backend/utils/auth';
import { createApprovalSchema } from '@/backend/utils/validation';

export async function GET(request) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId, userId, role } = auth;

    const allowedIds = await db.getAllowedProjectIds(tenantId, userId, role);
    const approvals = await db.getApprovals(tenantId);
    const filteredApprovals = approvals.filter(a => {
      if (role === 'admin' || role === 'architect') return true;
      if (a.client_id === userId || a.submitted_by === userId) return true;
      return a.drawings && allowedIds.includes(a.drawings.project_id);
    });
    return NextResponse.json({ approvals: filteredApprovals });
  } catch (error) {
    console.error('Get Approvals API Error:', error);
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
    const validation = createApprovalSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map(e => e.message).join(' ');
      return NextResponse.json({ error: errorMsg, details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { drawing_id, client_id, comments, submission_notes, due_date } = validation.data;

    const drawing = await db.getDrawing(drawing_id);
    if (!drawing) {
      return NextResponse.json({ error: 'Drawing not found.' }, { status: 404 });
    }

    if (drawing.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Drawing belongs to another tenant.' }, { status: 403 });
    }

    // Verify target user belongs to this tenant
    const client = await db.getUser(client_id);
    if (!client || client.tenant_id !== tenantId || !['client', 'admin', 'architect', 'staff'].includes(client.role)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid target user selected for approval review.' }, { status: 403 });
    }

    const initialNotes = submission_notes || comments || 'Please review and approve the attached drawing.';

    const newApproval = await db.createApproval({
      drawing_id,
      client_id,
      status: 'pending',
      comments: initialNotes,
      submission_notes: initialNotes,
      due_date: due_date || null,
      submitted_by: userId
    });

    // Log the approval request with rich metadata
    await logActivity(tenantId, userId, 'approval', newApproval.id, 'Approval Requested', {
      drawingName: drawing.name,
      dueDate: due_date || null,
      submissionNotes: initialNotes,
      projectId: drawing.project_id
    });

    // Notify the Client
    await createNotification(
      tenantId,
      client_id,
      'Drawing Approval Requested',
      `Architect has submitted "${drawing.name}" for your approval and review.${due_date ? ` (Due: ${due_date})` : ''}`,
      'approval_request'
    );

    return NextResponse.json({ message: 'Submitted for approval successfully', approval: newApproval });
  } catch (error) {
    console.error('Submit Approval API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
