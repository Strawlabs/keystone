import { supabase, db } from '../db/client.js';
import { emailService } from './resend.js';

export async function createNotification(firstArg, userId, title, message, type, link) {
  try {
    let tenantId;
    let finalUserId = userId;
    let finalTitle = title;
    let finalMessage = message;
    let finalType = type;
    let finalLink = link;

    if (typeof firstArg === 'object' && firstArg !== null && !Array.isArray(firstArg)) {
      tenantId = firstArg.tenantId;
      finalUserId = firstArg.userId;
      finalTitle = firstArg.title;
      finalMessage = firstArg.message;
      finalType = firstArg.type;
      finalLink = firstArg.link;
    } else {
      tenantId = firstArg;
    }

    const { data, error } = await supabase.from('notifications').insert([{
      tenant_id: tenantId,
      user_id: finalUserId,
      title: finalTitle,
      message: finalMessage,
      type: finalType,
      link: finalLink || null,
      is_read: false
    }]).select().maybeSingle();

    if (error) {
      console.error('Failed to create notification:', error.message);
    }

    // Try sending email
    try {
      const user = await db.getUser(finalUserId);
      if (user && user.email) {
        await emailService.sendNotificationEmail(user.email, user.name, finalTitle, finalMessage, finalLink);
      }
    } catch (emailErr) {
      console.error('Failed to send notification email:', emailErr.message);
    }

    return data;
  } catch (err) {
    console.error('Error in createNotification:', err.message);
    return null;
  }
}
