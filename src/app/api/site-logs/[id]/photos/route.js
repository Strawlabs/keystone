import { NextResponse } from 'next/server';
import { db } from '@/backend/db';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const headerTenantId = request.headers.get('x-tenant-id');
    const tenantId = headerTenantId || 't1';

    const body = await request.json();
    const { image_urls } = body;

    if (!image_urls || !Array.isArray(image_urls) || image_urls.length === 0) {
      return NextResponse.json({ error: 'At least one image URL is required.' }, { status: 400 });
    }

    // Check if site log exists and matches tenant
    const store = db; // simple reference
    // We can fetch site logs for this tenant and find the log
    const siteLogs = await db.getSiteLogs(tenantId);
    const logExists = siteLogs.some(l => l.id === id);

    if (!logExists) {
      return NextResponse.json({ error: 'Site log not found or unauthorized.' }, { status: 404 });
    }

    // Insert photos directly into Supabase site_log_photos
    const { supabase } = await import('@/backend/db/client');
    const photoInserts = image_urls.map(url => ({ site_log_id: id, image_url: url }));
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
