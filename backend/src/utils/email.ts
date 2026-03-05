import nodemailer from 'nodemailer';

// Create a transporter using SMTP configuration
let transporter: nodemailer.Transporter | null = null;

const isProduction = process.env.NODE_ENV === 'production';

async function getTransporter(): Promise<nodemailer.Transporter | null> {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    // Use real SMTP with connection timeout
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 10000, // 10s connection timeout
      socketTimeout: 10000, // 10s socket timeout
    });
    console.log('📧 Email transporter configured with SMTP:', smtpHost);
    return transporter;
  }

  // No SMTP configured
  if (isProduction) {
    // In production without SMTP, log a warning and return null
    console.warn('⚠️ SMTP not configured. Password reset emails will not be sent. Set SMTP_HOST, SMTP_USER, SMTP_PASS env vars.');
    return null;
  }

  // Development only: use Ethereal (fake SMTP for testing)
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
      connectionTimeout: 10000,
      socketTimeout: 10000,
    });
    console.log('📧 Using Ethereal test email account:', testAccount.user);
    return transporter;
  } catch (error) {
    console.warn('⚠️ Failed to create Ethereal test account. Emails will be logged to console instead.', error);
    return null;
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string
): Promise<{ previewUrl?: string | false }> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  const mailer = await getTransporter();

  // If no transporter available, log the reset link and return
  if (!mailer) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 PASSWORD RESET EMAIL (SMTP not configured)');
    console.log(`   To: ${to}`);
    console.log(`   Reset Link: ${resetLink}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return {};
  }

  const mailOptions: nodemailer.SendMailOptions = {
    from: process.env.SMTP_FROM || '"Knowled Platform" <noreply@knowled.com>',
    to,
    subject: 'Reset Your Password - Knowled Platform',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🔒 Password Reset</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            We received a request to reset the password for your Knowled Platform account.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Click the button below to reset your password. This link will expire in <strong>1 hour</strong>.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #4f46e5; font-size: 14px; word-break: break-all;">
            <a href="${resetLink}" style="color: #4f46e5;">${resetLink}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 12px; line-height: 1.6;">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
        </div>
      </div>
    `,
    text: `Password Reset Request\n\nWe received a request to reset your password.\n\nClick the following link to reset your password (expires in 1 hour):\n${resetLink}\n\nIf you didn't request this, please ignore this email.`,
  };

  try {
    const info = await mailer.sendMail(mailOptions);

    // In development with Ethereal, provide preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('📧 Preview password reset email:', previewUrl);
    }

    return { previewUrl };
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    // Log the link as fallback so the reset still works
    console.log('📧 Fallback — Reset link for', to, ':', resetLink);
    return {};
  }
}
