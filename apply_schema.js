const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// ── Read .env.local ────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '.env.local');
let supabaseUrl = '';
let dbPassword = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = trimmed.split('=').slice(1).join('=').trim();
    }
    if (trimmed.startsWith('SUPABASE_DB_PASSWORD=')) {
      dbPassword = trimmed.split('=').slice(1).join('=').trim();
    }
  }
} catch (e) {
  console.error('❌ Failed to read .env.local:', e.message);
  process.exit(1);
}

// ── Validate ───────────────────────────────────────────────────────────────
const match = supabaseUrl.match(/https:\/\/(.*?)\.supabase\.co/);
const refId = match ? match[1] : null;

if (!refId) {
  console.error('❌ Could not parse project ref ID from NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}
if (!dbPassword) {
  console.error('❌ SUPABASE_DB_PASSWORD is missing from .env.local');
  process.exit(1);
}

console.log(`\n🔗 Target: db.${refId}.supabase.co`);
console.log('📄 Schema file: supabase_schema.sql\n');

// ── Load schema SQL ────────────────────────────────────────────────────────
const schemaPath = path.join(__dirname, 'supabase_schema.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

// ── Connect & apply ────────────────────────────────────────────────────────
const client = new Client({
  host: `db.${refId}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: dbPassword,
  ssl: { rejectUnauthorized: false },
});

async function applySchema() {
  try {
    await client.connect();
    console.log('✅ Connected to database.');
    console.log('⏳ Applying schema (tables, RLS policies, functions)...\n');

    await client.query(schemaSql);

    // Reload PostgREST schema cache so the API picks up new tables immediately
    await client.query(`notify pgrst, 'reload schema';`);

    console.log('✅ Schema applied successfully!');
    console.log('✅ PostgREST schema cache reloaded.\n');
    console.log('Tables created:');
    console.log('  • tenants');
    console.log('  • users');
    console.log('  • projects');
    console.log('  • project_members');
    console.log('  • drawings');
    console.log('  • drawing_versions');
    console.log('  • approvals');
    console.log('  • tasks');
    console.log('  • site_logs');
    console.log('  • site_log_photos');
    console.log('  • notifications');
    console.log('  • activity_logs\n');
    console.log('RLS policies and helper functions also applied.');
  } catch (err) {
    console.error('❌ Schema application failed:', err.message);
    if (err.message.includes('already exists')) {
      console.log('\n💡 Hint: Some objects may already exist. This is safe to ignore.');
      console.log('   If you want a clean slate, drop all tables first via the Supabase SQL Editor.');
    }
  } finally {
    await client.end();
  }
}

applySchema();
