import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { logActivity } from '@/backend/services/activity';
import { createNotification } from '@/backend/services/notificationHelper';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const headerTenantId = request.headers.get('x-tenant-id');
    const tenantId = headerTenantId || searchParams.get('tenantId') || 't1';

    const approvals = await db.getApprovals(tenantId);
    return NextResponse.json({ approvals });
  } catch (error) {
    console.error('Get Approvals API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const headerTenantId = request.headers.get('x-tenant-id');
    const headerUserId = request.headers.get('x-user-id');

    const body = await request.json();
    const tenantId = headerTenantId || body.tenant_id || 't1';
    const userId = headerUserId || body.submitted_by || 'u2'; // default to architect user

    const { drawing_id, client_id, comments } = body;

    if (!drawing_id || !client_id) {
      return NextResponse.json({ error: 'Drawing ID and Client ID are required.' }, { status: 400 });
    }

    const drawing = await db.getDrawing(drawing_id);
    if (!drawing) {
      return NextResponse.json({ error: 'Drawing not found.' }, { status: 404 });
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
