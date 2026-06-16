import { NextResponse } from 'next/server';
import { supabaseAuth } from '@/backend/db/client';

// The sole admin email — only this email gets admin role
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();

/**
 * Validate password strength server-side.
 * Requirements: min 8 chars, uppercase, lowercase, number, special character.
 */
function validatePasswordStrength(password) {
  const errors = [];
  if (password.length < 8) errors.push('at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('an uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('a lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('a number');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) errors.push('a special character (!@#$%^&*...)');
  return errors;
}

export async function POST(request) {
  try {
    const { name, email, companyName, password } = await request.json();

    if (!name || !email || !companyName || !password) {
      return NextResponse.json(
        { error: 'All fields are required: name, email, company name, and password.' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Strong password validation
    const passwordErrors = validatePasswordStrength(password);
    if (passwordErrors.length > 0) {
      return NextResponse.json({
        error: `Password must contain ${passwordErrors.join(', ')}.`
      }, { status: 400 });
    }

    // Determine role: ONLY the designated admin email gets admin role
    const normalizedEmail = email.toLowerCase().trim();
    const assignedRole = (ADMIN_EMAIL && normalizedEmail === ADMIN_EMAIL) ? 'admin' : 'staff';

    console.log(`[Signup] ${normalizedEmail} → role: ${assignedRole}`);

    const { data: authData, error: authError } = await supabaseAuth.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          name: name.trim(),
          company_name: companyName.trim(),
          role: assignedRole
        }
      }
    });

    if (authError) {
      // Map common Supabase errors to user-friendly messages
      let message = authError.message;
      if (message.includes('already registered')) {
        message = 'An account with this email already exists. Please login instead.';
      } else if (message.includes('weak')) {
        message = 'Password is too weak. Use a mix of letters, numbers and symbols.';
      } else if (message.includes('rate limit') || message.includes('too many')) {
        message = 'Too many signup attempts. Please wait a moment and try again.';
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // If identities is empty, user already exists but is unconfirmed
    if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please check your inbox for a verification email or login.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Account created! Please check your email for a 6-digit verification code.',
      email: normalizedEmail,
      userId: authData.user?.id,
    });
  } catch (error) {
    console.error('Signup API Error:', error);
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
