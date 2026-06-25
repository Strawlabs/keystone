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
    const { tenantId } = auth;

    const approvals = await db.getApprovals(tenantId);
    return NextResponse.json({ approvals });
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

    const { drawing_id, client_id, comments } = validation.data;

    const drawing = await db.getDrawing(drawing_id);
    if (!drawing) {
      return NextResponse.json({ error: 'Drawing not found.' }, { status: 404 });
    }

    if (drawing.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Drawing belongs to another tenant.' }, { status: 403 });
    }

    // Verify client belongs to this tenant too
    const client = await db.getUser(client_id);
    if (!client || client.tenant_id !== tenantId || client.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized: Invalid client selected.' }, { status: 403 });
    }

    const newApproval = await db.createApproval({
      drawing_id,
      client_id,
      status: 'pending',
      comments: comments || 'Please review and approve the attached drawing.',
      submitted_by: userId
    });

    // Log the approval request
    await logActivity(tenantId, userId, 'approval', newApproval.id, 'Approval Requested', {
      drawingName: drawing.name
    });

    // Notify the Client
    await createNotification(
      tenantId,
      client_id,
      'Drawing Approval Requested',
      `Architect has submitted "${drawing.name}" for your approval and review.`,
      'approval_request'
    );

    return NextResponse.json({ message: 'Submitted for approval successfully', approval: newApproval });
  } catch (error) {
    console.error('Submit Approval API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
