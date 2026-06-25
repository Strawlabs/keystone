import { NextResponse } from 'next/server';
import { db, supabase } from '@/backend/db/client';
import { hashPassword, generateRandomPassword, getAuthContext } from '@/backend/utils/auth';
import { logActivity } from '@/backend/services/logger';
import { inviteUserSchema } from '@/backend/utils/validation';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * POST /api/admin/invite
 * Admin-only: creates a new user account and sends them a invitation email with credentials.
 * Body: { name, email, role, tenantId, adminId }
 * Role must be one of: architect, staff, client
 */
export async function POST(request) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId: authTenantId, userId: authAdminId, role: authRole } = auth;

    if (authRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Only admins can invite users.' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, role, tenantId, adminId } = body;

    // Enforce tenant isolation: requested tenantId/adminId must match authenticated context
    if (tenantId !== authTenantId || adminId !== authAdminId) {
      return NextResponse.json({ error: 'Tenant isolation violation. Cannot invite user under a different tenant.' }, { status: 403 });
    }

    // Validate using Zod
    const validation = inviteUserSchema.safeParse({ name, email, role, tenantId, adminId });
    if (!validation.success) {
      const errorMsg = validation.error.issues.map(e => e.message).join(' ');
      return NextResponse.json({ error: errorMsg, details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const adminUser = await db.getUser(authAdminId);
    if (!adminUser || adminUser.role !== 'admin' || adminUser.tenant_id !== authTenantId) {
      return NextResponse.json(
        { error: 'Unauthorized. Only admins can invite users.' },
        { status: 403 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // --- Check if user already exists in public.users ---
    const existingProfile = await db.getUserByEmail(normalizedEmail);
    if (existingProfile) {
      return NextResponse.json(
        { error: 'A user with this email already exists in this workspace.' },
        { status: 409 }
      );
    }

    // --- Generate random 16-character demo password ---
    const demoPassword = generateRandomPassword(16);
    const passwordHash = await hashPassword(demoPassword);

    // --- Provision user in Supabase Auth to satisfy the foreign key constraint ---
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: demoPassword,
      email_confirm: true
    });

    if (authError) {
      return NextResponse.json(
        { error: `Auth provisioning failed: ${authError.message}` },
        { status: 400 }
      );
    }

    const newUserId = authData.user.id;

    // --- Create user profile in PostgreSQL ---
    let userProfile;
    try {
      userProfile = await db.createUser({
        id: newUserId,
        tenant_id: tenantId,
        name: name.trim(),
        email: normalizedEmail,
        role,
        status: 'active',
        password_hash: passwordHash,
        needs_password_change: true,
        created_by: adminId
      });
    } catch (dbError) {
      console.error('[Admin Invite] DB profile creation error:', dbError.message);
      // Clean up auth user
      await supabase.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        { error: 'Failed to create user profile. Please try again.' },
        { status: 500 }
      );
    }

    // --- Send invitation email ---
    const loginLink = `${SITE_URL}`;
    await sendInviteEmail(normalizedEmail, name.trim(), role, adminUser.name, demoPassword, loginLink);

    // --- Log activity ---
    try {
      await logActivity(tenantId, adminId, 'auth', newUserId, 'User Invited', {
        invitee_email: normalizedEmail,
        role,
        invited_by: adminUser.name
      });
    } catch (logErr) {
      console.warn('[Admin Invite] Activity log failed (non-critical):', logErr.message);
    }

    console.log(`[Admin Invite] ${adminUser.name} invited ${normalizedEmail} as ${role} with demo password`);

    return NextResponse.json({
      message: `Invitation sent to ${normalizedEmail}. They will receive their demo credentials via email.`,
      user: {
        id: userProfile.id,
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role,
        status: userProfile.status
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[Admin Invite] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
  }
}

async function sendInviteEmail(email, name, role, invitedByName, demoPassword, loginLink) {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const { Resend } = await import('resend');
  const resendApiKey = process.env.RESEND_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

  if (!resendApiKey || resendApiKey.includes('YOUR_')) {
    console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
    console.log(`║ ✉️  [Email Mock] User Invitation sent to: ${email}`);
    console.log(`║    Invited As: ${roleLabel}`);
    console.log(`║    Invited By: ${invitedByName}`);
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
      subject: `You've been invited to Keystone as ${roleLabel}`,
      html: `
        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0;">🏗️ Keystone Studio</h1>
          </div>
          <h2 style="font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 12px;">You've been invited!</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 8px;">
            Hi <strong style="color: #e2e8f0;">${name}</strong>,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 16px;">
            <strong style="color: #e2e8f0;">${invitedByName}</strong> has invited you to join their workspace on Keystone Studio as an 
            <span style="color: #60a5fa; font-weight: 700;">${roleLabel}</span>.
            Here are your temporary login credentials:
          </p>
          <div style="background: #1e293b; border: 1px solid #334155; padding: 16px; border-radius: 12px; margin-bottom: 24px; font-family: monospace; font-size: 14px; color: #f1f5f9;">
            <div style="margin-bottom: 8px;"><strong>Email:</strong> ${email}</div>
            <div><strong>Demo Password:</strong> <span style="color: #38bdf8;">${demoPassword}</span></div>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #e2e8f0; font-weight: 600; margin-bottom: 24px;">
            ⚠️ You will be prompted to change this demo password upon your first login.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${loginLink}" style="display: inline-block; padding: 14px 32px; background: #2563eb; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 0 15px rgba(37,99,235,0.3);">
              Log In &amp; Change Password
            </a>
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
          <p style="font-size: 11px; color: #475569; text-align: center;">
            © ${new Date().getFullYear()} Keystone Studio Inc. All rights reserved.
          </p>
        </div>
      `
    });

    if (error) {
      console.error('[Admin Invite Email] Resend API Error:', error);
    } else {
      console.log(`[Admin Invite] Invite email sent to ${email} (ID: ${data?.id})`);
    }
  } catch (err) {
    console.error('[Admin Invite] Failed to send invite email:', err.message);
  }
}

/**
 * PATCH /api/admin/invite
 * Admin-only: update a user's role or status (activate/deactivate).
 * Body: { userId, tenantId, adminId, updates: { role?, status? } }
 */
export async function PATCH(request) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { tenantId: authTenantId, userId: authAdminId, role: authRole } = auth;

    if (authRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 403 });
    }

    const { userId, tenantId, adminId, updates } = await request.json();

    if (!userId || !tenantId || !adminId || !updates) {
      return NextResponse.json({ error: 'userId, tenantId, adminId and updates are required.' }, { status: 400 });
    }

    // Enforce tenant isolation
    if (tenantId !== authTenantId || adminId !== authAdminId) {
      return NextResponse.json({ error: 'Tenant isolation violation. Cannot update user under a different tenant.' }, { status: 403 });
    }

    // Verify requester is admin of this tenant
    const adminUser = await db.getUser(authAdminId);
    if (!adminUser || adminUser.role !== 'admin' || adminUser.tenant_id !== authTenantId) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
    }

    // Only allow role and status to be updated
    const safeUpdates = {};
    if (updates.role && ['architect', 'staff', 'client'].includes(updates.role)) {
      safeUpdates.role = updates.role;
    }
    if (updates.status && ['active', 'inactive'].includes(updates.status)) {
      safeUpdates.status = updates.status;
    }

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided.' }, { status: 400 });
    }

    const updatedUser = await db.updateUser(userId, safeUpdates);

    try {
      await logActivity(tenantId, adminId, 'auth', userId, 'User Updated', {
        updates: safeUpdates,
        updated_by: adminUser.name
      });
    } catch (logErr) {
      console.warn('[Admin Update] Activity log failed (non-critical):', logErr.message);
    }

    return NextResponse.json({ message: 'User updated successfully.', user: updatedUser });
  } catch (error) {
    console.error('[Admin Update] Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
