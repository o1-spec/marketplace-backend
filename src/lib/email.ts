import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@marketplace.com';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const mailOptions = {
    from: FROM_EMAIL,
    to,
    subject,
    html,
  };

  console.log("📧 Email Configuration:", {
    EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Not Set',
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'Set' : 'Not Set',
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
  });

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('📧 Email (Development Mode)');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('📧 Email would be sent in production mode');
      return { success: true };
    }

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: FROM_EMAIL,
    to,
    subject: 'Reset Your Password - Marketplace',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4ECDC4;">Reset Your Password</h1>
        <p>Hi ${name},</p>
        <p>You requested to reset your password for your Marketplace account. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="background-color: #4ECDC4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">Reset Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>The Marketplace Team</p>
      </div>
    `,
  };

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('📧 Password Reset Email (Development Mode)');
      console.log('To:', to);
      console.log('Subject: Reset Your Password - Marketplace');
      console.log('Reset URL:', resetUrl);
      console.log('Token:', token);
      console.log('📧 Email would be sent in production mode');
      return { success: true };
    }

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  const mailOptions = {
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to Marketplace!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4ECDC4;">Welcome to Marketplace!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for joining our marketplace platform. We're excited to have you on board!</p>
        <p>You can now access your account and start buying and selling.</p>
        <a href="${APP_URL}" style="background-color: #4ECDC4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Start Shopping</a>
        <p>Best regards,<br>The Marketplace Team</p>
      </div>
    `,
  };

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('📧 Welcome Email (Development Mode)');
      console.log('To:', to);
      console.log('Subject: Welcome to Marketplace!');
      console.log('📧 Email would be sent in production mode');
      return { success: true };
    }

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error };
  }
}

export async function sendEmailVerification(to: string, name: string, code: string) {
  const mailOptions = {
    from: FROM_EMAIL,
    to,
    subject: 'Verify Your Email Address - Marketplace',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4ECDC4;">Verify Your Email Address</h1>
        <p>Hi ${name},</p>
        <p>Please use the following 6-digit code to verify your email address for your Marketplace account:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #4ECDC4; letter-spacing: 4px;">${code}</span>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <p>Best regards,<br>The Marketplace Team</p>
      </div>
    `,
  };

  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log('📧 Email Verification (Development Mode)');
      console.log('To:', to);
      console.log('Subject: Verify Your Email Address - Marketplace');
      console.log('Verification Code:', code); // ✅ LOG THE CODE
      console.log('📧 Email would be sent in production mode');
      return { success: true };
    }

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error };
  }
}