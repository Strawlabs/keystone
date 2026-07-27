import { NextResponse } from 'next/server';
import { supabase } from '@/backend/db/client';
import { getAuthContext } from '@/backend/utils/auth';

export async function GET(request) {
  try {
    const auth = getAuthContext(request);
    if (!auth.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is super admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_super_admin')
      .eq('id', auth.userId)
      .single();

    if (userError || !user?.is_super_admin) {
      return NextResponse.json({ error: 'Forbidden. Requires SaaS Admin privileges.' }, { status: 403 });
    }

    // Fetch all tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: true });

    if (tenantsError) throw tenantsError;

    // Fetch user counts per tenant (group by tenant_id)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('tenant_id');
      
    if (usersError) throw usersError;

    // Map user counts
    const userCounts = {};
    users.forEach(u => {
      userCounts[u.tenant_id] = (userCounts[u.tenant_id] || 0) + 1;
    });

    // Format output
    const firms = tenants.map(t => {
      // Calculate renewal date loosely (1 year from created_at for simplicity)
      const createdAt = new Date(t.created_at);
      const renewalDate = new Date(createdAt.setFullYear(createdAt.getFullYear() + 1));
      const renewalStr = renewalDate.toLocaleString('default', { month: 'short', year: 'numeric' });

      // Format storage used (mock or use storage_used_bytes)
      const bytes = parseInt(t.storage_used_bytes || '0', 10);
      let storageStr = '0 GB';
      if (bytes > 0) {
        storageStr = (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
        if (storageStr === '0.00 GB') {
            storageStr = (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        }
      }

      // Convert plan string format ('free' -> 'Free', 'pro' -> 'Standard', 'enterprise' -> 'Enterprise')
      let planFormatted = 'Standard';
      if (t.subscription_plan === 'free') planFormatted = 'Basic';
      if (t.subscription_plan === 'pro') planFormatted = 'Standard';
      if (t.subscription_plan === 'enterprise') planFormatted = 'Enterprise';

      return {
        id: t.id,
        name: t.name,
        users: userCounts[t.id] || 0,
        storage: storageStr,
        plan: planFormatted,
        status: t.status || 'active',
        renewal: renewalStr
      };
    });

    return NextResponse.json({ firms });
  } catch (error) {
    console.error('[API] GET /api/admin/firms error:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching firms' },
      { status: 500 }
    );
  }
}
