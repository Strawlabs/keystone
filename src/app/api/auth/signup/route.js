import { NextResponse } from 'next/server';
import { supabase, supabaseAuth, db } from '@/backend/db/client';
import { logActivity } from '@/backend/services/logger';

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

    let authUser = null;
    let fallbackToStandardSignup = false;

    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true, // skip email verification
        user_metadata: {
          name: name.trim(),
          company_name: companyName.trim(),
          role: assignedRole
        }
      });

      if (authError) {
        console.warn('[Signup] admin.createUser error:', authError.message);
        // If it's a permission/service role key error or not allowed, fallback to standard signup
        if (authError.status === 401 || authError.message.includes('service_role') || authError.message.includes('not allowed')) {
          fallbackToStandardSignup = true;
        } else {
          let message = authError.message;
          if (message.includes('already registered') || message.includes('already exists') || message.includes('email_exists')) {
            message = 'An account with this email already exists. Please login instead.';
          }
          return NextResponse.json({ error: message }, { status: 400 });
        }
      } else {
        authUser = authData.user;
      }
    } catch (err) {
      console.warn('[Signup] admin.createUser exception:', err.message);
      fallbackToStandardSignup = true;
    }

    if (fallbackToStandardSignup) {
      console.log('[Signup] Falling back to standard signUp');
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

      authUser = authData.user;

      // If user identities is empty, user already exists but is unconfirmed
      if (authUser && authData.user.identities && authData.user.identities.length === 0) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please check your inbox for a verification email or login.' },
          { status: 400 }
        );
      }
    }

    if (!authUser) {
      return NextResponse.json(
        { error: 'Signup succeeded but no user was returned. Please try logging in.' },
        { status: 400 }
      );
    }

    // 1. Create or find tenant
    let tenantId;
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .ilike('name', companyName.trim())
      .maybeSingle();

    if (existingTenant) {
      tenantId = existingTenant.id;
    } else {
      const newTenant = await db.createTenant({
        name: companyName.trim(),
        subscription_plan: 'pro',
        status: 'active'
      });
      tenantId = newTenant.id;
    }

    // 2. Create or find user profile in public.users (PostgreSQL)
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    let userProfile = existingUser;
    if (!existingUser) {
      userProfile = await db.createUser({
        id: authUser.id,
        tenant_id: tenantId,
        name: name.trim(),
        email: normalizedEmail,
        role: assignedRole,
        status: 'active'
      });
      console.log(`[Signup] Created user profile in PostgreSQL: ${userProfile.id} (${normalizedEmail}, role: ${assignedRole})`);
    } else {
      // If user exists but role doesn't match the admin policy, enforce it
      if (existingUser.role !== assignedRole) {
        await supabase
          .from('users')
          .update({ role: assignedRole })
          .eq('id', authUser.id);
        userProfile = { ...existingUser, role: assignedRole };
        console.log(`[Signup] Corrected role for ${normalizedEmail}: ${existingUser.role} → ${assignedRole}`);
      }
    }

    // 3. Log activation
    try {
      await logActivity(tenantId, authUser.id, 'auth', authUser.id, 'Account Created & Activated', { 
        email: normalizedEmail,
        role: assignedRole
      });
    } catch (logErr) {
      console.warn('Activity log failed (non-critical):', logErr.message);
    }

    // 4. Try to sign the user in immediately to return a session
    let session = null;
    try {
      const { data: signInData, error: signInError } = await supabaseAuth.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (!signInError) {
        session = signInData.session;
      } else {
        console.warn('[Signup] Auto-login failed:', signInError.message);
      }
    } catch (signInErr) {
      console.warn('[Signup] Auto-login exception:', signInErr.message);
    }

    if (session) {
      return NextResponse.json({
        message: 'Account created and activated successfully!',
        user: {
          id: userProfile.id,
          tenant_id: userProfile.tenant_id,
          name: userProfile.name,
          email: userProfile.email,
          role: userProfile.role,
          avatar_url: userProfile.avatar_url || null,
          status: userProfile.status
        },
        session
      });
    }

    return NextResponse.json({
      message: 'Account created! Please check your email for a 6-digit verification code.',
      email: normalizedEmail,
      userId: authUser.id,
    });
  } catch (error) {
    console.error('Signup API Error:', error);
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
