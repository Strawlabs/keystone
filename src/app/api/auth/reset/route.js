import { NextResponse } from 'next/server';
import { supabaseAuth } from '@/backend/db/client';
import { emailService } from '@/backend/services/gmail.js';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Call Supabase password reset trigger
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'http://localhost:3000';
    const resetUrl = `${siteUrl}/auth/reset-confirm`;
    
    const { error: resetError } = await supabaseAuth.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: resetUrl
    });

    if (resetError) {
      console.error('Supabase reset error:', resetError.message);
      // Security: Don't reveal whether the email exists or not
      // Always return success message to prevent email enumeration attacks
    }

    // Try to send styled email via Resend (non-blocking)
    try {
      await emailService.sendPasswordResetEmail(normalizedEmail, resetUrl);
    } catch (emailErr) {
      console.warn('Gmail email failed (Supabase built-in email still sent):', emailErr.message);
    }

    // Security: Always return success to prevent email enumeration
    return NextResponse.json({ 
      message: 'If an account with that email exists, a password reset link has been sent. Please check your inbox.' 
    });
  } catch (error) {
    console.error('Password Reset API Error:', error);
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
