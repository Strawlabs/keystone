import { NextResponse } from 'next/server';
import { supabaseAuth } from '@/backend/db/client';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const { error } = await supabaseAuth.auth.resend({
      type: 'signup',
      email: email.toLowerCase().trim(),
    });

    if (error) {
      let message = error.message;
      if (message.includes('rate limit') || message.includes('too many')) {
        message = 'Too many attempts. Please wait a minute before requesting a new code.';
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({
      message: 'A new verification code has been sent to your email.'
    });
  } catch (error) {
    console.error('Resend OTP API Error:', error);
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
