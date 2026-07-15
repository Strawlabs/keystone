import nodemailer from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const SENDER_NAME = process.env.SENDER_NAME || 'Keystone Studio';

// Build transporter lazily — only if credentials exist
function createTransporter() {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
}

const transporter = createTransporter();

/**
 * Low-level email sender used by all helpers below.
 * @param {object} opts - { to, subject, html }
 * @returns {Promise<{success: boolean, mock?: boolean, messageId?: string}>}
 */
export async function sendEmail({ to, subject, html }) {
  // In dev/test, always redirect to the configured dev email override
  const recipient =
    process.env.NODE_ENV !== 'production'
      ? process.env.DEV_EMAIL_OVERRIDE || GMAIL_USER || to
      : to;

  if (!transporter) {
    console.log(
      `\n╔══════════════════════════════════════════════════════════════╗\n` +
      `║ ✉️  [Email Mock] To: ${recipient}\n` +
      `║    Subject: ${subject}\n` +
      `╚══════════════════════════════════════════════════════════════╝\n`
    );
    return { success: true, mock: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `${SENDER_NAME} <${GMAIL_USER}>`,
      to: recipient,
      subject,
      html,
    });
    console.log(`[Gmail] Email sent → ${recipient} | MsgID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Gmail] Failed to send email:', err.message);
    return null;
  }
}

// ─── Named email helpers (same API surface as the old resend.js) ──────────────

export const emailService = {
  /**
   * Send a password reset email.
   */
  sendPasswordResetEmail: async (email, resetUrl, otp = null) => {
    if (otp) {
      console.log(`\n🔑 [Forgot Password OTP generated for ${email}]: ${otp}\n`);
    }
    return sendEmail({
      to: email,
      subject: 'Reset Your Keystone Password & Verification Code',
      html: `
        <div style="font-family:'Inter',-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0f172a;color:#e2e8f0;border-radius:16px;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="font-size:24px;font-weight:700;color:#ffffff;margin:0;">🏗️ Keystone Studio</h1>
          </div>
          <h2 style="font-size:20px;font-weight:600;color:#ffffff;margin-bottom:16px;">Password Reset Request</h2>
          <p style="font-size:14px;line-height:1.6;color:#94a3b8;margin-bottom:24px;">
            We received a request to reset the password for your Keystone account
            (<strong style="color:#e2e8f0;">${email}</strong>).
          </p>
          ${otp ? `
          <div style="background:#1e293b;border:1px solid #334155;padding:20px;border-radius:14px;text-align:center;margin:24px 0;">
            <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Your 6-Digit Verification Code</div>
            <div style="font-size:32px;font-weight:800;color:#38bdf8;letter-spacing:8px;font-family:monospace;">${otp}</div>
          </div>
          <p style="font-size:13px;color:#94a3b8;text-align:center;margin-bottom:24px;">
            Enter this code on the verification screen, or click the button below:
          </p>
          ` : ''}
          <div style="text-align:center;margin:32px 0;">
            <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;box-shadow:0 0 15px rgba(37,99,235,0.3);">
              Reset Password Link
            </a>
          </div>
          <p style="font-size:12px;color:#64748b;line-height:1.5;">
            This code and link are valid for 15 minutes. If you did not request a password reset, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;" />
          <p style="font-size:11px;color:#475569;text-align:center;">
            © ${new Date().getFullYear()} Keystone Studio Inc. All rights reserved.
          </p>
        </div>
      `,
    });
  },

  /**
   * Send a welcome / account-activated email.
   */
  sendWelcomeEmail: async (email, name) => {
    return sendEmail({
      to: email,
      subject: 'Welcome to Keystone Studio',
      html: `
        <div style="font-family:'Inter',-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0f172a;color:#e2e8f0;border-radius:16px;">
          <h1 style="font-size:24px;font-weight:700;color:#ffffff;text-align:center;">Welcome to Keystone</h1>
          <p style="font-size:14px;line-height:1.6;color:#94a3b8;margin-top:16px;">
            Hi <strong style="color:#e2e8f0;">${name}</strong>, your account has been verified and activated.
            You can now log in and start managing your projects.
          </p>
          <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;" />
          <p style="font-size:11px;color:#475569;text-align:center;">
            © ${new Date().getFullYear()} Keystone Studio Inc.
          </p>
        </div>
      `,
    });
  },

  /**
   * Send an admin invitation email with temporary credentials.
   */
  sendInviteEmail: async ({ email, name, role, invitedByName, demoPassword, loginLink }) => {
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
    return sendEmail({
      to: email,
      subject: `You've been invited to Keystone as ${roleLabel}`,
      html: `
        <div style="font-family:'Inter',-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0f172a;color:#e2e8f0;border-radius:16px;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="font-size:22px;font-weight:700;color:#ffffff;margin:0;">🏗️ Keystone Studio</h1>
          </div>
          <h2 style="font-size:18px;font-weight:600;color:#ffffff;margin-bottom:12px;">You've been invited!</h2>
          <p style="font-size:14px;line-height:1.6;color:#94a3b8;margin-bottom:8px;">
            Hi <strong style="color:#e2e8f0;">${name}</strong>,
          </p>
          <p style="font-size:14px;line-height:1.6;color:#94a3b8;margin-bottom:16px;">
            <strong style="color:#e2e8f0;">${invitedByName}</strong> has invited you to join their workspace on Keystone Studio as an
            <span style="color:#60a5fa;font-weight:700;">${roleLabel}</span>.
            Here are your temporary login credentials:
          </p>
          <div style="background:#1e293b;border:1px solid #334155;padding:16px;border-radius:12px;margin-bottom:24px;font-family:monospace;font-size:14px;color:#f1f5f9;">
            <div style="margin-bottom:8px;"><strong>Email:</strong> ${email}</div>
            <div><strong>Demo Password:</strong> <span style="color:#38bdf8;">${demoPassword}</span></div>
          </div>
          <p style="font-size:14px;line-height:1.6;color:#e2e8f0;font-weight:600;margin-bottom:24px;">
            ⚠️ You will be prompted to change this demo password upon your first login.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${loginLink}" style="display:inline-block;padding:14px 32px;background:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;box-shadow:0 0 15px rgba(37,99,235,0.3);">
              Log In &amp; Change Password
            </a>
          </div>
          <p style="font-size:12px;color:#64748b;line-height:1.5;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;" />
          <p style="font-size:11px;color:#475569;text-align:center;">
            © ${new Date().getFullYear()} Keystone Studio Inc. All rights reserved.
          </p>
        </div>
      `,
    });
  },

  /**
   * Send a company registration welcome email with temp admin credentials.
   */
  sendCompanyWelcomeEmail: async ({ email, companyName, tempPassword, loginLink }) => {
    return sendEmail({
      to: email,
      subject: 'Welcome to Keystone — Your Admin Account is Ready',
      html: `
        <div style="font-family:'Inter',-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0f172a;color:#e2e8f0;border-radius:16px;">
          <div style="text-align:center;margin-bottom:32px;">
            <h1 style="font-size:22px;font-weight:700;color:#ffffff;margin:0;">🏗️ Keystone Studio</h1>
          </div>
          <h2 style="font-size:18px;font-weight:600;color:#ffffff;margin-bottom:12px;">Your Admin Account is Ready</h2>
          <p style="font-size:14px;line-height:1.6;color:#94a3b8;margin-bottom:16px;">
            Your workspace for <strong style="color:#e2e8f0;">${companyName}</strong> has been successfully set up on Keystone Studio.
            Here are your temporary administrative login credentials:
          </p>
          <div style="background:#1e293b;border:1px solid #334155;padding:16px;border-radius:12px;margin-bottom:24px;font-family:monospace;font-size:14px;color:#f1f5f9;">
            <div style="margin-bottom:8px;"><strong>Email:</strong> ${email}</div>
            <div><strong>Temporary Password:</strong> <span style="color:#38bdf8;">${tempPassword}</span></div>
          </div>
          <p style="font-size:14px;line-height:1.6;color:#e2e8f0;font-weight:600;margin-bottom:24px;">
            ⚠️ You will be prompted to change this temporary password upon your first login.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${loginLink}" style="display:inline-block;padding:14px 32px;background:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:12px;box-shadow:0 0 15px rgba(37,99,235,0.3);">
              Access Your Dashboard
            </a>
          </div>
          <p style="font-size:12px;color:#64748b;line-height:1.5;">
            If you didn't request this workspace setup, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;" />
          <p style="font-size:11px;color:#475569;text-align:center;">
            © ${new Date().getFullYear()} Keystone Studio Inc. All rights reserved.
          </p>
        </div>
      `,
    });
  },
};
