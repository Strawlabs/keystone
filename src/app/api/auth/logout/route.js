import { NextResponse } from 'next/server';
import { supabaseAuth } from '@/backend/db/client';
import { logActivity } from '@/backend/services/logger.js';

export async function POST(request) {
  try {
    const { userId, tenantId } = await request.json();

    // Log logout audit trail (non-blocking — never let logging crash logout)
    if (userId && tenantId) {
      try {
        await logActivity(tenantId, userId, 'auth', userId, 'User Logout');
      } catch (logErr) {
        console.warn('Logout activity log failed (non-critical):', logErr.message);
      }
    }

    // Terminate auth session in Supabase
    try {
      await supabaseAuth.auth.signOut();
    } catch (signOutErr) {
      console.warn('Supabase signOut error (non-critical):', signOutErr.message);
    }

    return NextResponse.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout API Error:', error);
    // Even if something fails, we should still "log out" client-side
    return NextResponse.json({ message: 'Logout completed' });
  }
}
