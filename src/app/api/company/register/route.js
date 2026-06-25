import { NextResponse } from 'next/server';
import { db, supabase } from '@/backend/db/client';
import { hashPassword, generateRandomPassword } from '@/backend/utils/auth';
import { emailService } from '@/backend/services/resend';
import { logActivity } from '@/backend/services/logger';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function POST(request) {
  try {
    const { company_name, company_email, admin_email, company_address, company_number } = await request.json();

    if (!company_name || !company_email || !admin_email || !company_address || !company_number) {
      return NextResponse.json(
        { error: 'All fields are required: Company Name, Company Email, Admin Email, Company Address, and Company Number.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(company_email) || !emailRegex.test(admin_email)) {
      return NextResponse.json(
        { error: 'Please provide valid email addresses.' },
        { status: 400 }
      );
    }

    const normalizedCompanyEmail = company_email.toLowerCase().trim();
    const normalizedAdminEmail = admin_email.toLowerCase().trim();

    // Check if company already exists by name or email
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .or(`name.eq."${company_name.trim()}",company_email.eq."${normalizedCompanyEmail}"`)
      .maybeSingle();

    if (existingTenant) {
      return NextResponse.json(
        { error: 'A company with this name or email is already registered.' },
        { status: 409 }
      );
    }

    // Check if admin user already exists
    const existingUser = await db.getUserByEmail(normalizedAdminEmail);
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this admin email already exists.' },
        { status: 409 }
      );
    }

    // 1. Create the tenant/company
    const newTenant = await db.createTenant({
      name: company_name.trim(),
      company_email: normalizedCompanyEmail,
      company_address: company_address.trim(),
      company_number: company_number.trim(),
      subscription_plan: 'pro',
      status: 'active'
    });

    // 2. Generate a random 16-character temporary password
    const tempPassword = generateRandomPassword(16);
    const passwordHash = await hashPassword(tempPassword);

    // 2. Provision the user in Supabase Auth to satisfy the foreign key constraint
    let adminId;
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: normalizedAdminEmail,
        password: tempPassword,
        email_confirm: true
      });

      if (authError) {
        throw new Error(`Auth provisioning failed: ${authError.message}`);
      }
      adminId = authData.user.id;
    } catch (authErr) {
      console.error('[Company Reg] Supabase Auth creation failed:', authErr.message);
      // Clean up the created tenant to prevent orphaned records
      await supabase.from('tenants').delete().eq('id', newTenant.id);
      return NextResponse.json(
        { error: authErr.message },
        { status: 400 }
      );
    }

    // 3. Create the admin user profile in public.users
    let adminUser;
    try {
      adminUser = await db.createUser({
        id: adminId,
        tenant_id: newTenant.id,
        name: 'Company Admin',
        email: normalizedAdminEmail,
        role: 'admin',
        status: 'active',
        password_hash: passwordHash,
        needs_password_change: true
      });
    } catch (dbError) {
      console.error('[Company Reg] DB profile creation error:', dbError.message);
      // Clean up the auth user and tenant to prevent orphaned records
      await supabase.auth.admin.deleteUser(adminId);
      await supabase.from('tenants').delete().eq('id', newTenant.id);
      return NextResponse.json(
        { error: 'Failed to create user profile. Please try again.' },
        { status: 500 }
      );
    }

    // 4. Send welcome email containing credentials
    const loginLink = `${SITE_URL}`;
    await sendWelcomeEmail(normalizedAdminEmail, company_name.trim(), tempPassword, loginLink);

    // 5. Log activity
    try {
      await logActivity(newTenant.id, adminId, 'auth', adminId, 'Company Registered', {
        company_name: company_name.trim(),
        admin_email: normalizedAdminEmail
      });
    } catch (logErr) {
      console.warn('[Company Reg] Activity log failed (non-critical):', logErr.message);
    }

    console.log(`[Company Reg] Registered ${company_name} with admin ${normalizedAdminEmail}`);

    return NextResponse.json({
      success: true,
      company_id: newTenant.id,
      message: 'Company and admin account registered successfully. Verification email sent.'
    }, { status: 201 });

  } catch (error) {
    console.error('[Company Reg] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

async function sendWelcomeEmail(email, companyName, tempPassword, loginLink) {
  const { Resend } = await import('resend');
  const resendApiKey = process.env.RESEND_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

  if (!resendApiKey || resendApiKey.includes('YOUR_')) {
    console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
    console.log(`║ ✉️  [Email Mock] Welcome Email sent to: ${email}`);
    console.log(`║    Company Name: ${companyName}`);
    console.log(`║    Temp Password: ${tempPassword}`);
    console.log(`║    Login Link: ${loginLink}`);
    console.log(`╚══════════════════════════════════════════════════════════════╝\n`);
    return;
  }

  try {
    const resend = new Resend(resendApiKey);
    const { data, error } = await resend.emails.send({
      from: `Keystone Studio <${senderEmail}>`,
      to: [process.env.NODE_ENV !== 'production' ? 'balayoghi51@gmail.com' : email],
      subject: `Welcome to Keystone - Your Admin Account is Ready`,
      html: `
        <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin: 0;">🏗️ Keystone Studio</h1>
          </div>
          <h2 style="font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 12px;">Your Admin Account is Ready</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 8px;">
            Hi there,
          </p>
          <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 16px;">
            Your workspace for <strong style="color: #e2e8f0;">${companyName}</strong> has been successfully set up on Keystone Studio.
            Here are your temporary administrative login credentials:
          </p>
          <div style="background: #1e293b; border: 1px solid #334155; padding: 16px; border-radius: 12px; margin-bottom: 24px; font-family: monospace; font-size: 14px; color: #f1f5f9;">
            <div style="margin-bottom: 8px;"><strong>Email:</strong> ${email}</div>
            <div><strong>Temporary Password:</strong> <span style="color: #38bdf8;">${tempPassword}</span></div>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #e2e8f0; font-weight: 600; margin-bottom: 24px;">
            ⚠️ You will be prompted to change this temporary password upon your first login.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${loginLink}" style="display: inline-block; padding: 14px 32px; background: #2563eb; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 0 15px rgba(37,99,235,0.3);">
              Access Your Dashboard
            </a>
          </div>
          <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
            If you didn't request this workspace setup, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
          <p style="font-size: 11px; color: #475569; text-align: center;">
            © ${new Date().getFullYear()} Keystone Studio Inc. All rights reserved.
          </p>
        </div>
      `
    });

    if (error) {
      console.error('[Company Reg Email] Resend API Error:', error);
    } else {
      console.log(`[Company Reg] Invite email sent to ${email} (ID: ${data?.id})`);
    }
  } catch (err) {
    console.error('[Company Reg] Failed to send invite email:', err.message);
  }
}
