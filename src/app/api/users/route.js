import { NextResponse } from 'next/server';
import { db, supabase } from '@/backend/db/client';
import { getAuthContext, generateRandomPassword, hashPassword } from '@/backend/utils/auth';
import { logActivity } from '@/backend/services/logger';
import { inviteUserSchema } from '@/backend/utils/validation';
import { emailService } from '@/backend/services/gmail';

// GET /api/users - List users for the authenticated tenant
export async function GET(request) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId, role } = auth;
    if (role === 'client') {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

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
  const result = await emailService.sendInviteEmail({
    email,
    name,
    role,
    invitedByName: 'Your Admin',
    demoPassword,
    loginLink,
  });
  if (result?.success && !result?.mock) {
    console.log(`[User Invite] Invite email sent to ${email}`);
  }
}
