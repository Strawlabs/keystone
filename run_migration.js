const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
let supabaseUrl = '';
let dbPassword = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('SUPABASE_DB_PASSWORD=')) {
      dbPassword = line.split('=')[1].trim();
    }
  }
} catch (e) {
  console.error('❌ Failed to read .env.local file:', e.message);
  process.exit(1);
}

// Extract project reference ID from Supabase URL
// URL is like: https://jcbkikbrhbheyuaxbhxi.supabase.co
const match = supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/);
const refId = match ? match[1] : null;

if (!refId) {
  console.error('❌ Could not parse project ref ID from NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

if (!dbPassword || dbPassword.includes('YOUR_') || dbPassword === '') {
  console.error('\n╔══════════════════════════════════════════════════════════════╗');
  console.error('║  ❌ DATABASE PASSWORD MISSING                                 ║');
  console.error('╠══════════════════════════════════════════════════════════════╣');
  console.error('║  To run this migration through code, please edit your        ║');
  console.error('║  .env.local file and add the following line:                 ║');
  console.error('║                                                              ║');
  console.error('║  SUPABASE_DB_PASSWORD=your_database_password                 ║');
  console.error('║                                                              ║');
  console.error('║  (Use the database password you created when setting up     ║');
  console.error('║   your Supabase project)                                     ║');
  console.error('╚══════════════════════════════════════════════════════════════╝\n');
  process.exit(1);
}

const client = new Client({
  host: `db.${refId}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: dbPassword,
  ssl: { rejectUnauthorized: false } // Required for Supabase SSL connections
});

const migrationSql = `
  -- 1. Extend tenants table with new verification fields
  alter table public.tenants add column if not exists company_email text unique;
  alter table public.tenants add column if not exists company_address text;
  alter table public.tenants add column if not exists company_number text;

  -- 2. Extend users table for custom credentials
  alter table public.users add column if not exists password_hash text;
  alter table public.users add column if not exists needs_password_change boolean default true;
  alter table public.users add column if not exists created_by uuid references public.users(id) on delete set null;
  alter table public.users add column if not exists last_login timestamp with time zone;

  -- 3. Force Supabase API to reload schema cache
  notify pgrst, 'reload schema';
`;

async function migrate() {
  console.log(`Connecting to database host: db.${refId}.supabase.co...`);
  try {
    await client.connect();
    console.log('✅ Connected successfully. Running DDL migrations...');
    
    await client.query(migrationSql);
    console.log('✅ Database migration applied successfully and schema cache reloaded!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
