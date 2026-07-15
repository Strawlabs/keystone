import { NextResponse } from 'next/server';
import { supabase } from '@/backend/db/client';
import { hashPassword, verifyJwt } from '@/backend/utils/auth';
import { logActivity } from '@/backend/services/logger';

export async function POST(request) {
  try {
    const { reset_token, otp, email, new_password } = await request.json();

    if (!new_password) {
      return NextResponse.json(
        { error: 'New password is required.' },
        { status: 400 }
      );
    }

    if (new_password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (!reset_token && (!email || !otp)) {
      return NextResponse.json(
        { error: 'Verification code (OTP) and email, OR a valid reset token, are required.' },
        { status: 400 }
      );
    }

    let user_id;
    let company_id;
    let user_email;

    // PATH A: Verification via 6-digit OTP code + email
    if (email && otp) {
      const normalizedEmail = email.toLowerCase().trim();
      const { data: user, error: lookupError } = await supabase
        .from('users')
        .select('*')
        .ilike('email', normalizedEmail)
        .maybeSingle();

      if (lookupError || !user) {
        return NextResponse.json(
          { error: 'No account found matching this email address.' },
          { status: 400 }
        );
      }

      let isOtpValid = false;
      // Check database reset_otp column if populated
      if (user.reset_otp && user.reset_otp === otp.trim()) {
        if (!user.reset_otp_expires_at || new Date(user.reset_otp_expires_at) >= new Date()) {
          isOtpValid = true;
        } else {
          return NextResponse.json(
            { error: 'This verification code has expired. Please request a new code.' },
            { status: 400 }
          );
        }
      }
      // Or check signed JWT token otp if provided (resilient against pending DB migration)
      else if (reset_token) {
        const decoded = verifyJwt(reset_token);
        if (decoded && decoded.otp === otp.trim() && decoded.email && decoded.email.toLowerCase() === normalizedEmail) {
          isOtpValid = true;
        }
      }

      if (!isOtpValid) {
        return NextResponse.json(
          { error: 'Invalid verification code. Please double-check the code sent to your email.' },
          { status: 400 }
        );
      }

      user_id = user.id;
      company_id = user.tenant_id;
      user_email = user.email;
    } 
    // PATH B: Verification via JWT Reset Token link
    else if (reset_token) {
      const decoded = verifyJwt(reset_token);
      if (!decoded) {
        return NextResponse.json(
          { error: 'Invalid or expired reset token. Please request a new link.' },
          { status: 400 }
        );
      }

      user_id = decoded.user_id;
      company_id = decoded.company_id;
      user_email = decoded.email;
    } else {
      return NextResponse.json(
        { error: 'Invalid authentication parameters for password reset.' },
        { status: 400 }
      );
    }

    // 2. Hash the new password using bcrypt
    const passwordHash = await hashPassword(new_password);

    // 3. Update the password hash in the users table and clear OTP
    let { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        needs_password_change: false,
        reset_otp: null,
        reset_otp_expires_at: null
      })
      .eq('id', user_id);

    // Graceful fallback if reset_otp columns migration is pending (`column users.reset_otp does not exist`)
    if (updateError && (updateError.code === '42703' || updateError.message?.includes('reset_otp'))) {
      console.warn('[Reset Password] reset_otp column not found in DB, updating only password_hash.');
      const fallbackRes = await supabase
        .from('users')
        .update({
          password_hash: passwordHash,
          needs_password_change: false
        })
        .eq('id', user_id);
      updateError = fallbackRes.error;
    }

    if (updateError) {
      throw updateError;
    }

    // 4. Log audit log activity
    try {
      if (company_id) {
        await logActivity(company_id, user_id, 'auth', user_id, 'Password Reset Completed', {
          email: user_email,
          method: otp ? 'otp_code' : 'reset_link'
        });
      }
    } catch (logErr) {
      console.warn('Logging password reset completion failed:', logErr.message);
    }

    console.log(`[Reset Password] Successfully updated password for ${user_email}`);

    return NextResponse.json({ success: true, message: 'Password has been reset successfully. You can now log in.' });

  } catch (error) {
    console.error('[Reset Password API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
