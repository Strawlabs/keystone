import { supabase } from '../db/client.js';

export async function createNotification(firstArg, userId, title, message, type) {
  try {
    let tenantId;
    let finalUserId = userId;
    let finalTitle = title;
    let finalMessage = message;
    let finalType = type;

    if (typeof firstArg === 'object' && firstArg !== null && !Array.isArray(firstArg)) {
      tenantId = firstArg.tenantId;
      finalUserId = firstArg.userId;
      finalTitle = firstArg.title;
      finalMessage = firstArg.message;
      finalType = firstArg.type;
    } else {
      tenantId = firstArg;
    }

    const { data, error } = await supabase.from('notifications').insert([{
      tenant_id: tenantId,
      user_id: finalUserId,
      title: finalTitle,
      message: finalMessage,
      type: finalType,
      is_read: false
    }]).select().maybeSingle();

    if (error) {
      console.error('Failed to create notification:', error.message);
    }
    return data;
  } catch (err) {
    console.error('Error in createNotification:', err.message);
    return null;
  }
}
