import { NextResponse } from 'next/server';
import { db } from '@/backend/db/client';
import { getAuthContext } from '@/backend/utils/auth';

export async function GET(request) {
  try {
    const auth = getAuthContext(request);
    if (auth.isAuthenticated) {
      const tenant = await db.getTenant(auth.tenantId);
      return NextResponse.json({ tenant });
    }

    const tenants = await db.getTenants();
    const companies = (tenants || []).map(t => ({ id: t.id, name: t.name }));
    return NextResponse.json({ companies });
  } catch (error) {
    console.error('[Get Companies API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch company details.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
    const { tenantId, role } = auth;
    if (role !== 'admin') return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });

    const body = await request.json();
    const updates = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.logo_url !== undefined) updates.logo_url = body.logo_url;
    if (body.address !== undefined) updates.company_address = body.address;
    if (body.contact_email !== undefined) updates.company_email = body.contact_email;

    if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No valid fields.' }, { status: 400 });

    const updated = await db.updateTenant(tenantId, updates);
    return NextResponse.json({ success: true, tenant: updated });
  } catch (error) {
    console.error('[PATCH /api/company] Error:', error);
    return NextResponse.json({ error: 'Failed to update company settings.' }, { status: 500 });
  }
}