import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const sendConfirmationEmail = async (name: string, email: string) => {
  const mailOptions = {
    from: `"Womb Care Early Access" <${env.EMAIL_FROM}>`,
    to: email,
    subject: 'Welcome to Early Access',
    text: `Hello ${name},\n\nThank you for joining the Early Access program.\n\nYou are now on the priority list and will be among the first to experience our platform.\n\nWe will notify you as soon as the platform launches.\n\nBest regards,\nThe Team`,
    html: `
      <p>Hello ${name},</p>
      <p>Thank you for joining the Early Access program.</p>
      <p>You are now on the priority list and will be among the first to experience our platform.</p>
      <p>We will notify you as soon as the platform launches.</p>
      <br>
      <p>Best regards,<br>The Team</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Message sent: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error('Error sending email:', error);
    return false;
  }
};
