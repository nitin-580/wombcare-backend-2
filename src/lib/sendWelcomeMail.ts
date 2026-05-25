
import { resend } from './resend';

export async function sendWelcomeMail(email: string, name: string) {
  console.log(`[Email] Sending welcome mail to: ${email}`);
  const result = await resend.emails.send({
    from: 'WombCare <support@wombcare.in>',
    to: email,
    subject: 'Welcome to WombCare',
    html: `
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; color: #1a1a1a; border-radius: 16px; border: 1px solid #f0f0f0;">
        <div style="margin-bottom: 32px;">
          <h1 style="color: #6d28d9; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">WombCare</h1>
        </div>
        
        <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #111827;">Welcome to the family, ${name}! ✨</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
          We're beyond excited to have you join WombCare. You're now part of a community dedicated to holistic wellness and personalized health journeys.
        </p>
        
        <div style="background: linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%); padding: 32px; border-radius: 12px; color: #ffffff; margin-bottom: 32px;">
          <p style="margin: 0; font-size: 16px; opacity: 0.9;">Your journey begins here. We'll be with you every step of the way, providing the tools and insights you need to thrive.</p>
        </div>

        <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 32px;">
          If you have any questions or just want to say hi, simply reply to this email. We're always here to support you.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 32px 0;">
        
        <p style="font-size: 14px; color: #9ca3af; margin: 0;">
          Best regards,<br>
          <strong>The WombCare Team</strong>
        </p>
      </div>
    `,
  });
  console.log(`[Email] Welcome mail sent successfully to: ${email}`);
  return result;
}