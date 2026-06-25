import { NextResponse } from 'next/server';
import { db, supabase } from '@/backend/db/client';
import { verifyPassword, hashPassword, verifyJwt } from '@/backend/utils/auth';
import { logActivity } from '@/backend/services/logger';

export async function POST(request) {
  try {
    const body = await request.json();
    const { reset_token, old_password, new_password } = body;

    if (!new_password || new_password.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(new_password);

    // --- CASE A: Reset via Token (Forced First Login or Forgot Password Reset Link) ---
    if (reset_token) {
      const decoded = verifyJwt(reset_token);
      if (!decoded) {
        return NextResponse.json(
          { error: 'Invalid or expired reset token. Please request a new link.' },
          { status: 400 }
        );
      }

      const { user_id, company_id } = decoded;

      // Update user password and clear needs_password_change flag
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: newHash,
          needs_password_change: false
        })
        .eq('id', user_id)
        .eq('tenant_id', company_id);

      if (updateError) {
        throw updateError;
      }

      try {
        await logActivity(company_id, user_id, 'auth', user_id, 'Password Changed (Token)', {
          email: decoded.email
        });
      } catch (logErr) {
        console.warn('Logging password change failed:', logErr.message);
      }

      return NextResponse.json({ success: true, message: 'Password updated successfully. You can now log in.' });
    }

    // --- CASE B: Authorized Change (Settings Page while Logged In) ---
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized. Auth token required.' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const session = verifyJwt(token);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid or expired token.' },
        { status: 401 }
      );
    }

    const { user_id, company_id } = session;

    if (!old_password) {
      return NextResponse.json(
        { error: 'Current password is required.' },
        { status: 400 }
      );
    }

    const user = await db.getUser(user_id);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    // Verify current password matches
    const isMatch = await verifyPassword(old_password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: 'Current password does not match. Please try again.' },
        { status: 400 }
      );
    }

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: newHash,
        needs_password_change: false
      })
      .eq('id', user_id)
      .eq('tenant_id', company_id);

    if (updateError) {
      throw updateError;
    }

    try {
      await logActivity(company_id, user_id, 'auth', user_id, 'Password Changed (Dashboard)', {
        email: user.email
      });
    } catch (logErr) {
      console.warn('Logging password change failed:', logErr.message);
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully.' });

  } catch (error) {
    console.error('[Change Password] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
