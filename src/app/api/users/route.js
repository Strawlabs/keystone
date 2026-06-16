import { NextResponse } from 'next/server';
import { db } from '@/backend/db/client';

// GET /api/users?tenantId=xxx
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required.' }, { status: 400 });
    }

    const users = await db.getUsers(tenantId);

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error('GET /api/users Error:', error);
    return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
  }
}

// POST /api/users (create a user profile — called internally after auth)
export async function POST(request) {
  try {
    const body = await request.json();
    const { id, tenant_id, name, email, role = 'staff', status = 'active' } = body;

    if (!id || !tenant_id || !name || !email) {
      return NextResponse.json({ error: 'id, tenant_id, name and email are required.' }, { status: 400 });
    }

    const user = await db.createUser({ id, tenant_id, name, email, role, status });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('POST /api/users Error:', error);
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
  }
}
