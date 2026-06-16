import { NextResponse } from 'next/server';
import { supabaseAuth, db } from '@/backend/db/client';
import { logActivity } from '@/backend/services/logger.js';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    // Call Supabase Auth signInWithPassword
    // Supabase handles bcrypt password hash comparison internally
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password
    });

    if (authError) {
      console.error('Supabase Auth Error:', authError.message);
      
      // Map common Supabase auth errors to user-friendly messages
      let message = authError.message;
      if (message.includes('Invalid login credentials')) {
        message = 'Invalid email or password. Please check your credentials and try again.';
      } else if (message.includes('Email not confirmed')) {
        message = 'Your email has not been verified yet. Please check your inbox for the verification code, or sign up again.';
      } else if (message.includes('Too many requests') || message.includes('rate limit')) {
        message = 'Too many login attempts. Please wait a moment and try again.';
      }
      
      return NextResponse.json({ error: message }, { status: 401 });
    }

    // Retrieve user profile from public.users table in PostgreSQL
    const user = await db.getUser(authData.user.id);

    if (!user) {
      console.error('User profile not found in PostgreSQL for auth ID:', authData.user.id);
      return NextResponse.json({ 
        error: 'Your account exists but the workspace profile was not found. This can happen if email verification was not completed. Please try signing up again.' 
      }, { status: 404 });
    }

    // Security: Reject login if user account is inactive
    if (user.status === 'inactive') {
      return NextResponse.json({ 
        error: 'Your account has been deactivated. Please contact the administrator.' 
      }, { status: 403 });
    }

    // Log login audit trail (non-blocking)
    try {
      await logActivity(user.tenant_id, user.id, 'auth', user.id, 'User Login', { 
        email: user.email,
        role: user.role,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });
    } catch (logErr) {
      console.warn('Activity log failed (non-critical):', logErr.message);
    }

    console.log(`[Login] ${user.email} logged in as ${user.role}`);

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        tenant_id: user.tenant_id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        status: user.status
      },
      session: authData.session
    });
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
