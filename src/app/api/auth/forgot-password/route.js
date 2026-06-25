import { NextResponse } from 'next/server';
import { db } from '@/backend/db/client';
import { generateResetToken } from '@/backend/utils/auth';
import { emailService } from '@/backend/services/resend';
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
  const { Resend } = await import('resend');
  const resendApiKey = process.env.RESEND_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

  if (!resendApiKey || resendApiKey.includes('YOUR_')) {
    console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
    console.log(`║ ✉️  [Email Mock] Password Reset Link sent to: ${email}`);
    console.log(`║    Reset Link: ${resetUrl}`);
    console.log(`╚══════════════════════════════════════════════════════════════╝\n`);
    return;
  }

  try {
    const resend = new Resend(resendApiKey);
    const { data, error } = await resend.emails.send({
      from: `Keystone Studio <${senderEmail}>`,
      to: [process.env.NODE_ENV !== 'production' ? 'balayoghi51@gmail.com' : email],
      subject: 'Reset Your Keystone Password',
      html: `
        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0;">🏗️ Keystone Studio</h1>
          </div>
          <h2 style="font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 12px;">Password Reset Request</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px;">
            We received a request to reset the password for your Keystone account (<strong style="color: #e2e8f0;">${email}</strong>).
            Click the button below to set a new password.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: #2563eb; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 0 15px rgba(37,99,235,0.3);">
              Reset Password
            </a>
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
            This link is valid for 15 minutes. If you did not request a password reset, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
          <p style="font-size: 11px; color: #475569; text-align: center;">
            © ${new Date().getFullYear()} Keystone Studio Inc. All rights reserved.
          </p>
        </div>
      `
    });

    if (error) {
      console.error('[Forgot Password Email] Resend API Error:', error);
    } else {
      console.log(`[Forgot Password] Reset email sent to ${email} (ID: ${data?.id})`);
    }
  } catch (err) {
    console.error('[Forgot Password Email] Failed to send email:', err.message);
  }
}
