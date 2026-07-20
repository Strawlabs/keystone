import { NextResponse } from 'next/server';
import { db } from '@/backend/db';
import { getAuthContext } from '@/backend/utils/auth';

export async function POST(request, { params }) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId, userId, role } = auth;
    const { id } = await params;

    const body = await request.json();
    const { image_urls } = body;

    if (!image_urls || !Array.isArray(image_urls) || image_urls.length === 0) {
      return NextResponse.json({ error: 'At least one image URL is required.' }, { status: 400 });
    }

    // Check if site log exists and matches tenant
    const siteLogs = await db.getSiteLogs(tenantId);
    const log = siteLogs.find(l => l.id === id);

    if (!log) {
      return NextResponse.json({ error: 'Site log not found or unauthorized.' }, { status: 404 });
    }

    if (role !== 'admin') {
      const allowedIds = await db.getAllowedProjectIds(tenantId, userId, role);
      if (log.project_id && !allowedIds.includes(log.project_id) && log.created_by !== userId) {
        return NextResponse.json({ error: 'Unauthorized: You do not have permission to add photos to this site log.' }, { status: 403 });
      }
    }

    // Insert photos directly into Supabase site_log_photos
    const { supabase, extractStoragePath } = await import('@/backend/db/client');
    const photoInserts = image_urls.map(url => ({
      site_log_id: id,
      image_url: url,
      storage_path: extractStoragePath(url)
    }));
    const { data: addedPhotos, error: insertError } = await supabase
      .from('site_log_photos')
      .insert(photoInserts)
      .select();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Photos added successfully', photos: addedPhotos });
  } catch (error) {
    console.error('Site Log Photos API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
