import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { logActivity } from '@/backend/services/activity';
import { getAuthContext } from '@/backend/utils/auth';
import { createDrawingRevisionSchema } from '@/backend/utils/validation';

export async function POST(request, { params }) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId, userId } = auth;
    const { id } = await params;

    const body = await request.json();
    const validation = createDrawingRevisionSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map(e => e.message).join(' ');
      return NextResponse.json({ error: errorMsg, details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { file_url, notes } = validation.data;
    const { storage_path } = body;

    const drawing = await db.getDrawing(id);
    if (!drawing) {
      return NextResponse.json({ error: 'Drawing not found.' }, { status: 404 });
    }

    if (drawing.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant mismatch' }, { status: 403 });
    }

    const result = await db.createDrawingRevision(id, {
      file_url,
      storage_path: storage_path || null,
      notes,
      uploaded_by: userId
    });

    // Log the revision
    await logActivity(tenantId, userId, 'drawing', id, 'Revision Uploaded', {
      drawingName: drawing.name,
      revisionNumber: result.version.revision_number,
      notes: notes,
      projectId: drawing.project_id
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
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId } = auth;
    const { id } = await params;

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
