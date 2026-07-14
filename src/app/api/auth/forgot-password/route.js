import { NextResponse } from 'next/server';
import { db, supabase } from '@/backend/db/client';
import { generateResetToken } from '@/backend/utils/auth';
import { emailService } from '@/backend/services/gmail';
import { logActivity } from '@/backend/services/logger';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function POST(request) {
  try {
    const { company_id, email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Fetch user by email and company_id
    let user;
    if (company_id) {
      user = await db.getUserByEmailAndTenant(normalizedEmail, company_id);
    } else {
      user = await db.getUserByEmail(normalizedEmail);
    }

    // Security: To prevent user enumeration, if user is not found, return success anyway
    if (!user || user.status === 'inactive') {
      console.log(`[Forgot Password] Request for non-existent or inactive user: ${normalizedEmail}`);
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a verification code and reset link have been sent.'
      });
    }

    // 2. Generate 6-digit OTP code and 15-minute expiration
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Store OTP inside users table if columns exist (graceful fallback if migration pending)
    const { error: dbUpdateErr } = await supabase
      .from('users')
      .update({ reset_otp: otp, reset_otp_expires_at: expiresAt })
      .eq('id', user.id);

    if (dbUpdateErr) {
      console.warn('[Forgot Password] Note: reset_otp table column update skipped or missing migration:', dbUpdateErr.message);
    }

    // Also generate a 15-minute reset token containing the OTP
    const token = generateResetToken({
      user_id: user.id,
      company_id: user.tenant_id,
      email: user.email,
      otp,
      purpose: 'forgot_password_reset'
    });

    const resetUrl = `${SITE_URL}?tab=reset-password&token=${token}`;

    // 3. Send the password reset email (including OTP box + button)
    await sendResetEmail(user.email, resetUrl, otp);

    // 4. Log activity
    try {
      await logActivity(user.tenant_id, user.id, 'auth', user.id, 'Password Reset Requested', {
        email: user.email,
        otp_sent: true
      });
    } catch (logErr) {
      console.warn('Logging password reset request failed:', logErr.message);
    }

    console.log(`[Forgot Password] Generated OTP and reset token for ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a verification code and reset link have been sent.',
      reset_token: token
    });

  } catch (error) {
    console.error('[Forgot Password API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

async function sendResetEmail(email, resetUrl, otp) {
  const result = await emailService.sendPasswordResetEmail(email, resetUrl, otp);
  if (result?.success && !result?.mock) {
    console.log(`[Forgot Password] Reset email sent to ${email}`);
  }
}
