import { supabase } from '../db/client.js';

export async function createNotification({ tenantId, userId, title, message, type }) {
  try {
    const { data, error } = await supabase.from('notifications').insert([{
      tenant_id: tenantId,
      user_id: userId,
      title: title,
      message: message,
      type: type,
      is_read: false
    }]);

    if (error) {
      console.error('Failed to create notification:', error.message);
    }
    return data;
  } catch (err) {
    console.error('Error in createNotification:', err.message);
    return null;
  }
}
