import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

// Only initialize if a real API key is configured
const resend = resendApiKey && !resendApiKey.includes('YOUR_') ? new Resend(resendApiKey) : null;

export const emailService = {
  /**
   * Send a password reset email to the user.
   * Falls back to console logging if Resend is not configured.
   */
  sendPasswordResetEmail: async (email, resetUrl) => {
    if (!resend) {
      console.log(`[Email Mock] Password reset for ${email} → ${resetUrl}`);
      return { success: true, mock: true };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: `Keystone Studio <${senderEmail}>`,
        to: [process.env.NODE_ENV !== 'production' ? 'balayoghi51@gmail.com' : email],
        subject: 'Reset Your Keystone Password',
        html: `
          <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: 24px; font-weight: 700; color: #ffffff; margin: 0;">Keystone Studio</h1>
            </div>
            <h2 style="font-size: 20px; font-weight: 600; color: #ffffff; margin-bottom: 16px;">Password Reset Request</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px;">
              We received a request to reset the password for your Keystone account (<strong style="color: #e2e8f0;">${email}</strong>).
              Click the button below to set a new password.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: #2563eb; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 0 15px rgba(37,99,235,0.3);">
                Reset Password
              </a>
            </div>
            <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
              If you didn't request this, you can safely ignore this email. This link expires in 1 hour.
            </p>
            <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
            <p style="font-size: 11px; color: #475569; text-align: center;">
              © ${new Date().getFullYear()} Keystone Studio Inc. All rights reserved.
            </p>
          </div>
        `
      });

      if (error) {
        console.error('Resend email error:', error);
        return null;
      }

      console.log('Password reset email sent:', data?.id);
      return { success: true, id: data?.id };
    } catch (err) {
      console.error('Failed to send password reset email:', err.message);
      return null;
    }
  },

  /**
   * Send a welcome/verification email (optional enhancement).
   */
  sendWelcomeEmail: async (email, name) => {
    if (!resend) {
      console.log(`[Email Mock] Welcome email for ${name} <${email}>`);
      return { success: true, mock: true };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: `Keystone Studio <${senderEmail}>`,
        to: [process.env.NODE_ENV !== 'production' ? 'balayoghi51@gmail.com' : email],
        subject: 'Welcome to Keystone Studio',
        html: `
          <div style="font-family: 'Inter', -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #0f172a; color: #e2e8f0; border-radius: 16px;">
            <h1 style="font-size: 24px; font-weight: 700; color: #ffffff; text-align: center;">Welcome to Keystone</h1>
            <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-top: 16px;">
              Hi <strong style="color: #e2e8f0;">${name}</strong>, your account has been verified and activated.
              You can now log in and start managing your projects.
            </p>
            <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
            <p style="font-size: 11px; color: #475569; text-align: center;">
              © ${new Date().getFullYear()} Keystone Studio Inc.
            </p>
          </div>
        `
      });

      if (error) {
        console.error('Resend welcome email error:', error);
        return null;
      }
      return { success: true, id: data?.id };
    } catch (err) {
      console.error('Failed to send welcome email:', err.message);
      return null;
    }
  }
};
