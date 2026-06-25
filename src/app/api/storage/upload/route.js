import { NextResponse } from 'next/server';
import { supabase } from '@/backend/db/client';
import { getAuthContext } from '@/backend/utils/auth';

export async function POST(request) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const path = formData.get('path') || 'drawings'; // e.g. drawings, site-logs

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to buffer for Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Format safe random filename
    const lastDotIndex = file.name.lastIndexOf('.');
    const fileExtension = lastDotIndex !== -1 ? file.name.slice(lastDotIndex + 1) : '';
    const baseName = lastDotIndex !== -1 ? file.name.slice(0, lastDotIndex) : file.name;
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileName = fileExtension ? `${Date.now()}_${cleanBaseName}.${fileExtension}` : `${Date.now()}_${cleanBaseName}`;
    const filePath = `${path}/${fileName}`;

    const bucketName = 'keystone-assets';

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage Upload Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Retrieve the public URL for database storage
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return NextResponse.json({
      message: 'Upload successful',
      fileUrl: publicUrlData.publicUrl,
      path: filePath
    });
  } catch (error) {
    console.error('Storage Upload API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
