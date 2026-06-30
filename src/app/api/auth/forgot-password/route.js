import { NextResponse } from 'next/server';
import { db } from '@/backend/db/client';
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
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // 2. Generate a 15-minute reset token
    const token = generateResetToken({
      user_id: user.id,
      company_id: user.tenant_id,
      email: user.email,
      purpose: 'forgot_password_reset'
    });

    const resetUrl = `${SITE_URL}?tab=reset-password&token=${token}`;

    // 3. Send the password reset email
    await sendResetEmail(user.email, resetUrl);

    // 4. Log activity
    try {
      await logActivity(user.tenant_id, user.id, 'auth', user.id, 'Password Reset Requested', {
        email: user.email
      });
    } catch (logErr) {
      console.warn('Logging password reset request failed:', logErr.message);
    }

    console.log(`[Forgot Password] Generated reset token for ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('[Forgot Password API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

async function sendResetEmail(email, resetUrl) {
  const result = await emailService.sendPasswordResetEmail(email, resetUrl);
  if (result?.success && !result?.mock) {
    console.log(`[Forgot Password] Reset email sent to ${email}`);
  }
}
