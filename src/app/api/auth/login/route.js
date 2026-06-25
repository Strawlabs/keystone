import { NextResponse } from 'next/server';
import { db, supabase } from '@/backend/db/client';
import { verifyPassword, signJwt, generateResetToken, hashPassword } from '@/backend/utils/auth';
import { logActivity } from '@/backend/services/logger';

export async function POST(request) {
  try {
    const { company_id, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Fetch user from PostgreSQL
    let user;
    if (company_id) {
      user = await db.getUserByEmailAndTenant(normalizedEmail, company_id);
    } else {
      user = await db.getUserByEmail(normalizedEmail);
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password. Please check your credentials.' },
        { status: 401 }
      );
    }

    // 2. Load company/tenant and check status
    const tenant = await db.getTenant(user.tenant_id);
    if (!tenant || tenant.status === 'suspended' || tenant.status === 'deleted') {
      return NextResponse.json(
        { error: 'Your company workspace has been suspended or deleted. Please contact support.' },
        { status: 403 }
      );
    }

    if (user.status === 'inactive') {
      return NextResponse.json(
        { error: 'Your user account has been deactivated. Please contact your administrator.' },
        { status: 403 }
      );
    }

    // 3. Verify Password (using bcrypt, fallback to Supabase Auth for on-the-fly migration)
    let isPasswordCorrect = false;
    if (user.password_hash) {
      isPasswordCorrect = await verifyPassword(password, user.password_hash);
    } else {
      // Fallback for legacy users: try Supabase Auth
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

        const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });

        if (!authError && authData.user) {
          isPasswordCorrect = true;
          // Migrate user by saving password hash to DB
          const newHash = await hashPassword(password);
          await supabase
            .from('users')
            .update({ password_hash: newHash })
            .eq('id', user.id);
          console.log(`[Login Migration] Migrated password hash for legacy user: ${normalizedEmail}`);
        }
      } catch (authErr) {
        console.error('[Login Fallback] Supabase Auth validation failed:', authErr.message);
      }
    }

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: 'Invalid email or password. Please check your credentials.' },
        { status: 401 }
      );
    }

    // 4. Check if password change is forced on first login
    if (user.needs_password_change) {
      const resetToken = generateResetToken({
        user_id: user.id,
        company_id: user.tenant_id,
        email: user.email,
        purpose: 'first_login_reset'
      });

      return NextResponse.json({
        force_password_change: true,
        reset_token: resetToken,
        message: 'Password change required on first login.'
      });
    }

    // 5. Generate custom JWT token for session
    const jwtPayload = {
      company_id: user.tenant_id,
      user_id: user.id,
      role: user.role,
      email: user.email
    };

    const token = signJwt(jwtPayload);

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // 6. Log success audit trail (non-blocking)
    try {
      await logActivity(user.tenant_id, user.id, 'auth', user.id, 'User Login (JWT)', {
        email: user.email,
        role: user.role,
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      });
    } catch (logErr) {
      console.warn('[Login] Activity log failed:', logErr.message);
    }

    console.log(`[Login Custom] ${user.email} logged in under tenant ${user.tenant_id}`);

    return NextResponse.json({
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        tenant_id: user.tenant_id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error('[Login API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
