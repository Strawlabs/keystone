import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { logActivity } from '@/backend/services/activity';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const headerTenantId = request.headers.get('x-tenant-id');
    const headerUserId = request.headers.get('x-user-id');

    const body = await request.json();
    const tenantId = headerTenantId || body.tenant_id || 't1';
    const userId = headerUserId || body.uploaded_by || 'u1';

    const { file_url, notes } = body;

    if (!file_url || !notes) {
      return NextResponse.json({ error: 'File URL and revision notes are required.' }, { status: 400 });
    }

    const drawing = await db.getDrawing(id);
    if (!drawing) {
      return NextResponse.json({ error: 'Drawing not found.' }, { status: 404 });
    }

    if (drawing.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant mismatch' }, { status: 403 });
    }

    const result = await db.createDrawingRevision(id, {
      file_url,
      notes,
      uploaded_by: userId
    });

    // Log the revision
    await logActivity(tenantId, userId, 'drawing', id, 'Revision Uploaded', {
      drawingName: drawing.name,
      revisionNumber: result.version.revision_number,
      notes: notes
    });

    return NextResponse.json({
      message: 'Revision uploaded successfully',
      drawing: result.drawing,
      version: result.version
    });
  } catch (error) {
    console.error('Upload Revision API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const headerTenantId = request.headers.get('x-tenant-id');
    const tenantId = headerTenantId || 't1';

    const drawing = await db.getDrawing(id);
    if (!drawing) {
      return NextResponse.json({ error: 'Drawing not found.' }, { status: 404 });
    }

    if (drawing.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant mismatch' }, { status: 403 });
    }

    const versions = await db.getDrawingVersions(id);
    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Get Revisions API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
