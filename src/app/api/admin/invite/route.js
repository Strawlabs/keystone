import { NextResponse } from 'next/server';
import { supabase, supabaseAuth, db } from '@/backend/db/client';
import { emailService } from '@/backend/services/resend';
import { logActivity } from '@/backend/services/logger';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * POST /api/admin/invite
 * Admin-only: creates a new user account and sends them a password-setup email.
 * Body: { name, email, role, tenantId, adminId }
 * Role must be one of: architect, staff, client (admin cannot create another admin this way)
 */
export async function POST(request) {
  try {
    const { name, email, role, tenantId, adminId } = await request.json();

    // --- Basic validation ---
    if (!name || !email || !role || !tenantId || !adminId) {
      return NextResponse.json(
        { error: 'name, email, role, tenantId and adminId are required.' },
        { status: 400 }
      );
    }

    const allowedRoles = ['architect', 'staff', 'client'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: architect, staff, client.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    // --- Verify the requester is an admin of this tenant ---
    const adminUser = await db.getUser(adminId);
    if (!adminUser || adminUser.role !== 'admin' || adminUser.tenant_id !== tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized. Only admins can invite users.' },
        { status: 403 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // --- Check if user already exists in public.users ---
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        { error: 'A user with this email already exists in your workspace.' },
        { status: 409 }
      );
    }

    // --- Create user in Supabase Auth (service role, bypasses email confirmation) ---
    // We use a random temporary password; user will reset via the invite link
    const tempPassword = `Temp_${Math.random().toString(36).slice(2, 10)}!Kst`;

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: tempPassword,
      email_confirm: true, // skip email verification — admin already verified intent
      user_metadata: {
        name: name.trim(),
        role,
        invited_by: adminId,
        tenant_id: tenantId
      }
    });

    if (authError) {
      console.error('[Admin Invite] Supabase Auth error:', authError.message);
      let message = authError.message;
      if (message.includes('already been registered') || message.includes('already exists')) {
        message = 'This email address is already registered in Supabase Auth. The user may need to reset their password.';
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const authUser = authData.user;

    // --- Create user profile in public.users ---
    let userProfile;
    try {
      userProfile = await db.createUser({
        id: authUser.id,
        tenant_id: tenantId,
        name: name.trim(),
        email: normalizedEmail,
        role,
        status: 'active',
        created_by: adminId
      });
    } catch (dbError) {
      console.error('[Admin Invite] DB profile creation error:', dbError.message);
      // Attempt cleanup of the auth user to avoid orphaned accounts
      await supabase.auth.admin.deleteUser(authUser.id);
      return NextResponse.json(
        { error: 'Failed to create user profile. Please try again.' },
        { status: 500 }
      );
    }

    // --- Generate a password-reset link for first-login setup ---
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: { redirectTo: `${SITE_URL}` }
    });

    let inviteLink = `${SITE_URL}`;
    if (!resetError && resetData?.properties?.action_link) {
      inviteLink = resetData.properties.action_link;
    }

    // --- Send invite email ---
    await sendInviteEmail(normalizedEmail, name.trim(), role, adminUser.name, inviteLink);

    // --- Log activity ---
    try {
      await logActivity(tenantId, adminId, 'auth', authUser.id, 'User Invited', {
        invitee_email: normalizedEmail,
        role,
        invited_by: adminUser.name
      });
    } catch (logErr) {
      console.warn('[Admin Invite] Activity log failed (non-critical):', logErr.message);
    }

    console.log(`[Admin Invite] ${adminUser.name} invited ${normalizedEmail} as ${role}`);

    return NextResponse.json({
      message: `Invitation sent to ${normalizedEmail}. They will receive an email to set their password.`,
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

async function sendInviteEmail(email, name, role, invitedByName, inviteLink) {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const { Resend } = await import('resend');
  const resendApiKey = process.env.RESEND_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

  if (!resendApiKey || resendApiKey.includes('YOUR_')) {
    console.log(`[Email Mock] Invite email for ${name} <${email}> as ${roleLabel}`);
    console.log(`[Email Mock] Set-password link: ${inviteLink}`);
    return;
  }

  try {
    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: `Keystone Studio <${senderEmail}>`,
      to: [email],
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
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px;">
            <strong style="color: #e2e8f0;">${invitedByName}</strong> has invited you to join their workspace on Keystone Studio as a 
            <span style="color: #60a5fa; font-weight: 700;">${roleLabel}</span>.
            Click the button below to set your password and get started.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${inviteLink}" style="display: inline-block; padding: 14px 32px; background: #2563eb; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 0 15px rgba(37,99,235,0.3);">
              Set Password &amp; Join Workspace
            </a>
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
            This link expires in 24 hours. If you didn't expect this invitation, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
          <p style="font-size: 11px; color: #475569; text-align: center;">
            © ${new Date().getFullYear()} Keystone Studio Inc. All rights reserved.
          </p>
        </div>
      `
    });
    console.log(`[Admin Invite] Invite email sent to ${email}`);
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
    const { userId, tenantId, adminId, updates } = await request.json();

    if (!userId || !tenantId || !adminId || !updates) {
      return NextResponse.json({ error: 'userId, tenantId, adminId and updates are required.' }, { status: 400 });
    }

    // Verify requester is admin of this tenant
    const adminUser = await db.getUser(adminId);
    if (!adminUser || adminUser.role !== 'admin' || adminUser.tenant_id !== tenantId) {
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
