import { NextResponse } from 'next/server';
import { supabase } from '@/backend/db/client';
import { hashPassword, verifyJwt } from '@/backend/utils/auth';
import { logActivity } from '@/backend/services/logger';

export async function POST(request) {
  try {
    const { reset_token, new_password } = await request.json();

    if (!reset_token || !new_password) {
      return NextResponse.json(
        { error: 'Reset token and new password are required.' },
        { status: 400 }
      );
    }

    if (new_password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // 1. Verify the JWT reset token
    const decoded = verifyJwt(reset_token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token. Please request a new link.' },
        { status: 400 }
      );
    }

    const { user_id, company_id, email } = decoded;

    // 2. Hash the new password using bcrypt
    const passwordHash = await hashPassword(new_password);

    // 3. Update the password hash in the users table
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        needs_password_change: false
      })
      .eq('id', user_id)
      .eq('tenant_id', company_id);

    if (updateError) {
      throw updateError;
    }

    // 4. Log audit log activity
    try {
      await logActivity(company_id, user_id, 'auth', user_id, 'Password Reset Completed', {
        email: email
      });
    } catch (logErr) {
      console.warn('Logging password reset completion failed:', logErr.message);
    }

    console.log(`[Reset Password] Successfully updated password for ${email}`);

    return NextResponse.json({ success: true, message: 'Password has been reset successfully.' });

  } catch (error) {
    console.error('[Reset Password API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
