import { NextResponse } from 'next/server';
import { db, supabase } from '@/backend/db/client';
import { getAuthContext, generateRandomPassword, hashPassword } from '@/backend/utils/auth';
import { logActivity } from '@/backend/services/logger';
import { inviteUserSchema } from '@/backend/utils/validation';

// GET /api/users - List users for the authenticated tenant
export async function GET(request) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId } = auth;

    // Enforce tenant isolation
    const users = await db.getUsers(tenantId);

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error('GET /api/users Error:', error);
    return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
  }
}

// POST /api/users - Create a new user (admin only)
export async function POST(request) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId, userId: adminId, role: adminRole } = auth;

    // Auth & Authorization check
    if (adminRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role, name } = body;

    const displayName = name || (email && email.includes('@') ? email.split('@')[0] : 'New User');

    const validation = inviteUserSchema.safeParse({ name: displayName, email, role, tenantId, adminId });
    if (!validation.success) {
      const errorMsg = validation.error.issues.map(e => e.message).join(' ');
      return NextResponse.json({ error: errorMsg, details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await db.getUserByEmail(normalizedEmail);
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 409 });
    }

    // Generate credentials
    const demoPassword = generateRandomPassword(16);
    const passwordHash = await hashPassword(demoPassword);
    // Provision user in Supabase Auth to satisfy the foreign key constraint
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: demoPassword,
      email_confirm: true
    });

    if (authError) {
      return NextResponse.json({ error: `Auth provisioning failed: ${authError.message}` }, { status: 400 });
    }

    const newUserId = authData.user.id;

    // Create the user profile in public.users
    let newUser;
    try {
      newUser = await db.createUser({
        id: newUserId,
        tenant_id: tenantId,
        name: displayName.trim(),
        email: normalizedEmail,
        role: role,
        status: 'active',
        password_hash: passwordHash,
        needs_password_change: true,
        created_by: adminId
      });
    } catch (dbError) {
      console.error('DB user creation error:', dbError);
      // Clean up auth user
      await supabase.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: 'Failed to create user profile in database.' }, { status: 500 });
    }

    // Send invitation email
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    await sendInviteEmail(normalizedEmail, displayName, role, demoPassword, SITE_URL);

    // Log audit log
    try {
      await logActivity(tenantId, adminId, 'auth', newUserId, 'User Created', {
        email: normalizedEmail,
        role: role
      });
    } catch (logErr) {
      console.warn('Logging user creation failed:', logErr.message);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST /api/users Error:', error);
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
  }
}

async function sendInviteEmail(email, name, role, demoPassword, loginLink) {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const { Resend } = await import('resend');
  const resendApiKey = process.env.RESEND_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

  if (!resendApiKey || resendApiKey.includes('YOUR_')) {
    console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
    console.log(`║ ✉️  [Email Mock] User invitation sent to: ${email}`);
    console.log(`║    Role: ${roleLabel}`);
    console.log(`║    Demo Password: ${demoPassword}`);
    console.log(`║    Login Link: ${loginLink}`);
    console.log(`╚══════════════════════════════════════════════════════════════╝\n`);
    return;
  }

  try {
    const resend = new Resend(resendApiKey);
    const { data, error } = await resend.emails.send({
      from: `Keystone Studio <${senderEmail}>`,
      to: [process.env.NODE_ENV !== 'production' ? 'balayoghi51@gmail.com' : email],
      subject: `You've been invited to join Keystone`,
      html: `
        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
          <h2 style="font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 12px;">Welcome to Keystone</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 16px;">
            You have been invited to join your team's workspace as a <strong>${roleLabel}</strong>.
            Here are your temporary login credentials:
          </p>
          <div style="background: #1e293b; border: 1px solid #334155; padding: 16px; border-radius: 12px; margin-bottom: 24px; font-family: monospace; font-size: 14px; color: #f1f5f9;">
            <div style="margin-bottom: 8px;"><strong>Email:</strong> ${email}</div>
            <div><strong>Demo Password:</strong> <span style="color: #38bdf8;">${demoPassword}</span></div>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #e2e8f0; font-weight: 600; margin-bottom: 24px;">
            ⚠️ You will be prompted to set a new permanent password on your first login.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${loginLink}" style="display: inline-block; padding: 14px 32px; background: #2563eb; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px;">
              Log In &amp; Change Password
            </a>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('[User Invite Email] Resend API Error:', error);
    } else {
      console.log(`[User Invite] Invite email sent to ${email} (ID: ${data?.id})`);
    }
  } catch (err) {
    console.error('Failed to send invite email:', err.message);
  }
}
