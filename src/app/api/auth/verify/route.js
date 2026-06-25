import { NextResponse } from 'next/server';
import { supabaseAuth, supabase, db } from '@/backend/db/client';
import { logActivity } from '@/backend/services/activity.js';

// The sole admin email — enforced at verify time as a second layer of defense
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();

export async function POST(request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required.' },
        { status: 400 }
      );
    }

    if (code.trim().length !== 6) {
      return NextResponse.json(
        { error: 'Please enter the complete 6-digit code from your email.' },
        { status: 400 }
      );
    }

    // Verify OTP with Supabase Auth
    const { data: verifyData, error: verifyError } = await supabaseAuth.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token: code.trim(),
      type: 'signup'
    });

    if (verifyError) {
      let message = verifyError.message;

      // Map common Supabase OTP errors to user-friendly messages
      if (
        message.includes('expired') ||
        message.includes('invalid') ||
        message.includes('Token has expired') ||
        message.includes('otp_expired')
      ) {
        message = 'This verification code has expired or is invalid. Please click "Resend Code" to receive a new one.';
      } else if (message.includes('not found')) {
        message = 'No pending verification found for this email. Please sign up again.';
      }

      return NextResponse.json({ error: message }, { status: 400 });
    }

    const authUser = verifyData?.user;
    if (!authUser) {
      return NextResponse.json(
        { error: 'Verification succeeded but no user was returned. Please try logging in.' },
        { status: 400 }
      );
    }

    const {
      name = 'User',
      company_name = 'My Practice',
    } = authUser.user_metadata || {};

    // SECURITY: Double-check admin role enforcement at verification time
    // Only the designated admin email gets admin role, regardless of what metadata says
    const normalizedEmail = email.toLowerCase().trim();
    const assignedRole = (ADMIN_EMAIL && normalizedEmail === ADMIN_EMAIL) ? 'admin' : 'staff';

    console.log(`[Verify] ${normalizedEmail} → role: ${assignedRole}`);

    // 1. Create or find tenant
    let tenantId;
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .ilike('name', company_name.trim())
      .maybeSingle();

    if (existingTenant) {
      tenantId = existingTenant.id;
    } else {
      const newTenant = await db.createTenant({
        name: company_name.trim(),
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
      console.log(`[Verify] Created user profile in PostgreSQL: ${userProfile.id} (${normalizedEmail}, role: ${assignedRole})`);
    } else {
      // If user exists but role doesn't match the admin policy, enforce it
      if (existingUser.role !== assignedRole) {
        await supabase
          .from('users')
          .update({ role: assignedRole })
          .eq('id', authUser.id);
        userProfile = { ...existingUser, role: assignedRole };
        console.log(`[Verify] Corrected role for ${normalizedEmail}: ${existingUser.role} → ${assignedRole}`);
      }
    }

    // 3. Log activation
    try {
      await logActivity(tenantId, authUser.id, 'auth', authUser.id, 'Account Verified & Activated', { 
        email: normalizedEmail,
        role: assignedRole
      });
    } catch (logErr) {
      console.warn('Activity log failed (non-critical):', logErr.message);
    }

    return NextResponse.json({
      message: 'Account verified and activated successfully!',
      user: {
        id: userProfile.id,
        tenant_id: userProfile.tenant_id,
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role,
        avatar_url: userProfile.avatar_url || null,
        status: userProfile.status
      },
      session: verifyData.session
    });
  } catch (error) {
    console.error('Verification API Error:', error);
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
