import { NextResponse } from 'next/server';
import { db, supabase } from '@/backend/db/client';
import { hashPassword, generateRandomPassword, getAuthContext } from '@/backend/utils/auth';
import { logActivity } from '@/backend/services/logger';
import { inviteUserSchema } from '@/backend/utils/validation';
import { emailService } from '@/backend/services/gmail';

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
      if (existingProfile.status === 'disabled') {
        const reactivated = await db.updateUser(existingProfile.id, {
          status: 'active',
          name: name.trim() || existingProfile.name,
          role: role || existingProfile.role,
          tenant_id: tenantId
        });
        try { await supabase.auth.admin.updateUserById(existingProfile.id, { ban_duration: 'none' }); } catch (_) {}
        return NextResponse.json(
          { success: true, user: reactivated, message: 'Reactivated previously disabled user account.' },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { error: 'A user with this email already exists in this workspace.' },
        { status: 409 }
      );
    }

    // --- Generate random 16-character demo password ---
    const demoPassword = generateRandomPassword(16);
    const passwordHash = await hashPassword(demoPassword);

    // --- Provision user in Supabase Auth to satisfy the foreign key constraint ---
    let newUserId;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: demoPassword,
      email_confirm: true
    });

    if (authError) {
      const isAlreadyRegistered = authError.message?.toLowerCase().includes('already registered') ||
                                  authError.message?.toLowerCase().includes('already exists');
      if (isAlreadyRegistered) {
        const { data: listRes } = await supabase.auth.admin.listUsers();
        const existingAuthUser = listRes?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);
        if (existingAuthUser) {
          newUserId = existingAuthUser.id;
        } else {
          return NextResponse.json(
            { error: `Auth provisioning failed: ${authError.message}` },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: `Auth provisioning failed: ${authError.message}` },
          { status: 400 }
        );
      }
    } else {
      newUserId = authData.user.id;
    }

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
  const result = await emailService.sendInviteEmail({ email, name, role, invitedByName, demoPassword, loginLink });
  if (result?.success && !result?.mock) {
    console.log(`[Admin Invite] Invite email sent to ${email}`);
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
