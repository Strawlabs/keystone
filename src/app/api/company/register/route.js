import { NextResponse } from 'next/server';
import { db, supabase } from '@/backend/db/client';
import { hashPassword, generateRandomPassword } from '@/backend/utils/auth';
import { emailService } from '@/backend/services/gmail';
import { logActivity } from '@/backend/services/logger';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function POST(request) {
  try {
    const { company_name, company_email, admin_email, admin_name, company_address, company_number } = await request.json();

    if (!company_name || !company_email || !admin_email || !admin_name || !company_address || !company_number) {
      return NextResponse.json(
        { error: 'All fields are required: Company Name, Company Email, Admin Name, Admin Email, Company Address, and Company Number.' },
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
        name: admin_name.trim(),
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
  const result = await emailService.sendCompanyWelcomeEmail({ email, companyName, tempPassword, loginLink });
  if (result?.success && !result?.mock) {
    console.log(`[Company Reg] Welcome email sent to ${email}`);
  }
}
