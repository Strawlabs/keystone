import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { logActivity } from '@/backend/services/activity';
import { getAuthContext } from '@/backend/utils/auth';
import { updateDrawingSchema } from '@/backend/utils/validation';
import { supabase } from '@/backend/db/client';

// GET /api/drawings/[id] — fetch single drawing with versions
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
      return NextResponse.json({ error: 'Unauthorized: Tenant mismatch.' }, { status: 403 });
    }

    const versions = await db.getDrawingVersions(id);
    return NextResponse.json({ drawing, versions });
  } catch (error) {
    console.error('Get Drawing API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/drawings/[id] — update drawing metadata (name, drawing_number, category)
export async function PATCH(request, { params }) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId, userId } = auth;
    const { id } = await params;

    // Permission check: only admin or architect can update drawing metadata
    const { role } = auth;
    if (role === 'client' || role === 'staff') {
      return NextResponse.json({ error: 'Unauthorized: Insufficient permissions to update drawing metadata.' }, { status: 403 });
    }

    const drawing = await db.getDrawing(id);
    if (!drawing) {
      return NextResponse.json({ error: 'Drawing not found.' }, { status: 404 });
    }
    if (drawing.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant mismatch.' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateDrawingSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map(e => e.message).join(' ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { data: updatedDrawing, error } = await supabase
      .from('drawings')
      .update(validation.data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity(tenantId, userId, 'drawing', id, 'Drawing Updated', {
      drawingName: drawing.name,
      updates: validation.data
    });

    return NextResponse.json({ message: 'Drawing updated successfully', drawing: updatedDrawing });
  } catch (error) {
    console.error('Update Drawing API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/drawings/[id] — delete drawing and remove from storage
export async function DELETE(request, { params }) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId, userId } = auth;
    const { id } = await params;

    // Permission check: only admin or architect can delete drawings
    const { role } = auth;
    if (role === 'client' || role === 'staff') {
      return NextResponse.json({ error: 'Unauthorized: Insufficient permissions to delete drawings.' }, { status: 403 });
    }

    const drawing = await db.getDrawing(id);
    if (!drawing) {
      return NextResponse.json({ error: 'Drawing not found.' }, { status: 404 });
    }
    if (drawing.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized: Tenant mismatch.' }, { status: 403 });
    }

    // Get all versions to clean up storage
    const versions = await db.getDrawingVersions(id);

    // Collect all storage paths to delete
    const storagePaths = [];
    if (drawing.storage_path) storagePaths.push(drawing.storage_path);
    for (const v of versions) {
      if (v.storage_path && !storagePaths.includes(v.storage_path)) {
        storagePaths.push(v.storage_path);
      }
    }

    // Remove from Supabase Storage (non-blocking — log errors but don't fail)
    if (storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('keystone-assets')
        .remove(storagePaths);
      if (storageError) {
        console.warn('Storage deletion warning (non-fatal):', storageError.message);
      }
    }

    // Delete from DB (cascades to drawing_versions and approvals)
    await db.deleteDrawing(id);

    await logActivity(tenantId, userId, 'drawing', id, 'Drawing Deleted', {
      drawingName: drawing.name
    });

    return NextResponse.json({ message: 'Drawing deleted successfully' });
  } catch (error) {
    console.error('Delete Drawing API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
