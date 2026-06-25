import { NextResponse } from 'next/server';
import { db } from '@/backend/db/client';

// GET /api/company - List all registered companies for the login page selection dropdown
export async function GET(request) {
  try {
    const tenants = await db.getTenants();
    const companies = (tenants || []).map(t => ({
      id: t.id,
      name: t.name
    }));

    return NextResponse.json({ companies });
  } catch (error) {
    console.error('[Get Companies API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch companies.' }, { status: 500 });
  }
}
