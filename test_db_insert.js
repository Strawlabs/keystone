const path = require('path');
// Load environment variables using Next.js built-in loader
require('@next/env').loadEnvConfig(path.join(__dirname, '.'));

const { db, supabase } = require('./src/backend/db/client');

async function testInsert() {
  const uniqueId = Date.now();
  try {
    console.log('Inserting tenant...');
    const newTenant = await db.createTenant({
      name: `Acme Inc ${uniqueId}`,
      company_email: `acme_${uniqueId}@corporate.com`,
      company_address: '123 Acme Headquarters, Boston, MA',
      company_number: '+1 (555) 123-4567',
      subscription_plan: 'pro',
      status: 'active'
    });
    console.log('✅ Created tenant:', newTenant);

    const adminEmail = `admin_${uniqueId}@corporate.com`;
    console.log('Provisioning admin user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: 'TemporaryPassword123!',
      email_confirm: true
    });

    if (authError) {
      throw authError;
    }

    const adminId = authData.user.id;
    console.log('✅ Provisioned user in Supabase Auth with ID:', adminId);

    console.log('Inserting user into public.users...');
    const adminUser = await db.createUser({
      id: adminId,
      tenant_id: newTenant.id,
      name: 'Company Admin',
      email: adminEmail,
      role: 'admin',
      status: 'active',
      password_hash: 'mock_password_hash',
      needs_password_change: true
    });
    console.log('✅ Created admin user in public.users:', adminUser);

  } catch (err) {
    console.error('❌ Database insertion failed:', err);
  }
}

testInsert();
