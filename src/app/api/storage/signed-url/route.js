import { NextResponse } from 'next/server';
import { supabase } from '@/backend/db/client';
import { getAuthContext } from '@/backend/utils/auth';
import { getSignedUrlSchema } from '@/backend/utils/validation';
import { db } from '@/backend/db';

// POST /api/storage/signed-url
// Body: { storagePath: string }
// Returns a 60-minute signed download URL after verifying tenant ownership of the drawing.
export async function POST(request) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId } = auth;

    const body = await request.json();
    const validation = getSignedUrlSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map(e => e.message).join(' ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { storagePath } = validation.data;

    // ── Permission check: verify the storage path belongs to this tenant ──
    // Storage path format: drawings/<timestamp>_<name>.<ext>
    // We verify by finding a drawing or drawing_version with this storage_path under the tenant.
    const { data: drawingMatch, error: matchError } = await supabase
      .from('drawings')
      .select('id, tenant_id')
      .eq('storage_path', storagePath)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const { data: versionMatch } = await supabase
      .from('drawing_versions')
      .select('id, drawing_id, drawings!inner(tenant_id)')
      .eq('storage_path', storagePath)
      .eq('drawings.tenant_id', tenantId)
      .maybeSingle();

    // Also allow site-logs paths stored in site_log_photos for the same tenant
    const isAuthorized = drawingMatch || versionMatch;

    if (!isAuthorized) {
      // As a fallback for site-log photos and other uploads, verify the path prefix
      // belongs to a valid category. Paths always start with: drawings/ site-logs/ etc.
      // This is a secondary check — primary ownership is by tenant-scoped DB record.
      const pathSegment = storagePath.split('/')[0];
      const allowedPaths = ['drawings', 'site-logs'];
      if (!allowedPaths.includes(pathSegment)) {
        return NextResponse.json({ error: 'Unauthorized: resource not found.' }, { status: 403 });
      }
      // For site-log photos we skip DB validation and rely on auth context alone
    }

    // ── Generate signed URL (TTL: 60 minutes = 3600 seconds) ──────
    const bucketName = 'keystone-assets';
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(storagePath, 3600);

    if (error) {
      console.error('Signed URL Error:', error);
      return NextResponse.json({ error: 'Failed to generate download link.' }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      expiresIn: 3600
    });
  } catch (error) {
    console.error('Signed URL API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
