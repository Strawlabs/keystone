import { supabase } from '../db/client.js';

export async function logActivity(tenantId, userId, entityType, entityId, action, metadata = {}) {
  try {
    const { data, error } = await supabase.from('activity_logs').insert([{
      tenant_id: tenantId,
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      action: action,
      metadata: metadata
    }]);

    if (error) {
      console.error('Failed to log activity:', error.message);
    }
    return data;
  } catch (err) {
    console.error('Error in logActivity:', err.message);
    return null;
  }
}
