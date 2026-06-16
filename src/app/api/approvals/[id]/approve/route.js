import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { logActivity } from '@/backend/services/activity';
import { createNotification } from '@/backend/services/notificationHelper';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const headerTenantId = request.headers.get('x-tenant-id');
    const headerUserId = request.headers.get('x-user-id');

    const body = await request.json().catch(() => ({}));
    const tenantId = headerTenantId || body.tenant_id || 't1';
    const userId = headerUserId || body.client_id || 'u4'; // default to client user
    const comments = body.comments || 'Approved.';

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

    const updatedApproval = await db.updateApprovalStatus(id, 'approved', comments);

    // Log the approval action
    await logActivity(tenantId, userId, 'approval', id, 'Drawing Approved', {
      drawingName: drawing.name,
      comments
    });

    // Notify the architect who submitted it, and the admin
    if (approval.submitted_by) {
      await createNotification(
        tenantId,
        approval.submitted_by,
        'Drawing Approved',
        `Client has approved drawing "${drawing.name}". Comments: "${comments}"`,
        'approval_response'
      );
    }

    const users = await db.getUsers(tenantId);
    const adminUser = users.find(u => u.role === 'admin');
    if (adminUser && adminUser.id !== approval.submitted_by) {
      await createNotification(
        tenantId,
        adminUser.id,
        'Drawing Approved',
        `Client has approved drawing "${drawing.name}".`,
        'approval_response'
      );
    }

    return NextResponse.json({ message: 'Drawing approved successfully', approval: updatedApproval });
  } catch (error) {
    console.error('Approve Drawing API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
