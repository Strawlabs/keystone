import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { logActivity } from '@/backend/services/activity';
import { createNotification } from '@/backend/services/notificationHelper';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const headerTenantId = request.headers.get('x-tenant-id');
    const headerUserId = request.headers.get('x-user-id');

    const body = await request.json();
    const tenantId = headerTenantId || body.tenant_id || 't1';
    const userId = headerUserId || body.client_id || 'u4';
    const comments = body.comments || 'Revision requested.';
    
    // Can be 'rejected' or 'revision_requested'
    const status = body.status === 'rejected' ? 'rejected' : 'revision_requested';

    const approval = await db.getApproval(id);
    if (!approval) {
      return NextResponse.json({ error: 'Approval request not found.' }, { status: 404 });
    }

    const drawing = await db.getDrawing(approval.drawing_id);
    if (!drawing) {
      return NextResponse.json({ error: 'Drawing not found.' }, { status: 404 });
    }

    if (drawing.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant mismatch' }, { status: 403 });
    }

    const updatedApproval = await db.updateApprovalStatus(id, status, comments);

    const actionText = status === 'rejected' ? 'Drawing Rejected' : 'Revision Requested';

    // Log the action
    await logActivity(tenantId, userId, 'approval', id, actionText, {
      drawingName: drawing.name,
      comments
    });

    // Notify the architect who submitted it, and the admin
    if (approval.submitted_by) {
      await createNotification(
        tenantId,
        approval.submitted_by,
        actionText,
        `Client responded to "${drawing.name}". Status: ${actionText}. Comments: "${comments}"`,
        'approval_response'
      );
    }

    const users = await db.getUsers(tenantId);
    const adminUser = users.find(u => u.role === 'admin');
    if (adminUser && adminUser.id !== approval.submitted_by) {
      await createNotification(
        tenantId,
        adminUser.id,
        actionText,
        `Client responded to "${drawing.name}". Status: ${actionText}.`,
        'approval_response'
      );
    }

    return NextResponse.json({ message: `${actionText} logged successfully`, approval: updatedApproval });
  } catch (error) {
    console.error('Reject Drawing API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
