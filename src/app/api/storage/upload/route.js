import { NextResponse } from 'next/server';
import { supabase } from '@/backend/db/client';
import { getAuthContext } from '@/backend/utils/auth';

// Allowed MIME types for drawing uploads
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  // DWG files often come through with these content types
  'application/acad',
  'application/x-acad',
  'application/autocad_dwg',
  'image/vnd.dwg',
  'image/x-dwg',
  'application/dwg',
  'application/octet-stream' // DWG fallback — validated by extension below
]);

const ALLOWED_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'dwg']);

// 50 MB cap
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export async function POST(request) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { role } = auth;
    if (role === 'client') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const path = formData.get('path') || 'drawings'; // e.g. drawings, site-logs

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    }

    // ── File size validation ──────────────────────────────────────
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum allowed size is 50 MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)} MB.` },
        { status: 400 }
      );
    }

    // ── File type validation (extension) ─────────────────────────
    const originalName = file.name || '';
    const lastDotIndex = originalName.lastIndexOf('.');
    const fileExtension = lastDotIndex !== -1
      ? originalName.slice(lastDotIndex + 1).toLowerCase()
      : '';

    if (!ALLOWED_EXTENSIONS.has(fileExtension)) {
      return NextResponse.json(
        { error: `Unsupported file type ".${fileExtension}". Allowed types: PDF, JPG, PNG, DWG.` },
        { status: 400 }
      );
    }

    // For non-octet-stream MIME types, validate MIME against allowed list
    const mimeType = (file.type || 'application/octet-stream').toLowerCase();
    if (mimeType !== 'application/octet-stream' && !ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported file type. Allowed types: PDF, JPG, PNG, DWG.` },
        { status: 400 }
      );
    }

    // ── Construct safe file name ──────────────────────────────────
    const baseName = lastDotIndex !== -1 ? originalName.slice(0, lastDotIndex) : originalName;
    const cleanBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileName = `${Date.now()}_${cleanBaseName}.${fileExtension}`;
    const filePath = `${path}/${fileName}`;

    // ── Convert to buffer ─────────────────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const bucketName = 'keystone-assets';

    // ── Upload to Supabase Storage (private bucket) ───────────────
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage Upload Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ── Generate a short-lived signed URL (60 min) for immediate use ──
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600);

    const signedUrl = (!signedUrlError && signedUrlData?.signedUrl)
      ? signedUrlData.signedUrl
      : null;

    return NextResponse.json({
      message: 'Upload successful',
      fileUrl: signedUrl || filePath,  // signed URL for immediate preview; fallback to path
      storagePath: filePath,            // permanent path stored in DB for future signed-URL generation
      path: filePath
    });
  } catch (error) {
    console.error('Storage Upload API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

