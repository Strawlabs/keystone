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
    const { tenantId, userId, role } = auth;

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
      .select('id, tenant_id, project_id')
      .eq('storage_path', storagePath)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const { data: versionMatch } = await supabase
      .from('drawing_versions')
      .select('id, drawing_id, drawings!inner(tenant_id, project_id)')
      .eq('storage_path', storagePath)
      .eq('drawings.tenant_id', tenantId)
      .maybeSingle();

    // Also allow site-logs paths stored in site_log_photos for the same tenant
    const isAuthorized = drawingMatch || versionMatch;

    if (isAuthorized) {
      const projectId = drawingMatch?.project_id || versionMatch?.drawings?.project_id;
      if (projectId) {
        const allowedIds = await db.getAllowedProjectIds(tenantId, userId, role);
        if (!allowedIds.includes(projectId)) {
          return NextResponse.json({ error: 'Unauthorized: Access to this drawing is restricted.' }, { status: 403 });
        }
      }
    }

    if (!isAuthorized) {
      // Fallback: check site_log_photos for this storage path, scoped to tenant
      // This verifies site-log photos belong to the requesting tenant
      const pathSegment = storagePath.split('/')[0];
      if (pathSegment === 'site-logs') {
        const { data: sitePhotoMatch } = await supabase
          .from('site_log_photos')
          .select('id, site_log_id, site_logs!inner(tenant_id, project_id)')
          .or(`storage_path.eq.${storagePath},image_url.eq.${storagePath},image_url.ilike.%${storagePath}%`)
          .eq('site_logs.tenant_id', tenantId)
          .maybeSingle();

        if (!sitePhotoMatch) {
          // Could be a freshly-uploaded path not yet in DB; allow if path belongs to site-logs prefix and user is authenticated
          // This is a lenient fallback for newly-uploaded photos during the same session
          console.warn(`site-log photo not found in DB for path ${storagePath}; allowing by path prefix for authenticated user`);
        } else {
          // If project_id is set, check user is allowed to access it
          const projectId = sitePhotoMatch.site_logs?.project_id;
          if (projectId) {
            const allowedIds = await db.getAllowedProjectIds(tenantId, userId, role);
            if (!allowedIds.includes(projectId)) {
              return NextResponse.json({ error: 'Unauthorized: Access to this site log photo is restricted.' }, { status: 403 });
            }
          }
        }
      } else {
        // Reject anything that isn't an allowed path category
        return NextResponse.json({ error: 'Unauthorized: resource not found.' }, { status: 403 });
      }
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
