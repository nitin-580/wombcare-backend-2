import { resend } from './resend';

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOtpMail = async (email: string, otp: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'WombCare <support@wombcare.in>',
      to: [email],
      subject: 'Password Reset OTP - WombCare',
      html: `
        <div style="font-family: 'Inter', sans-serif; background-color: #f9fafb; padding: 40px; color: #1f2937;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Password Reset</h1>
            </div>
            <div style="padding: 32px;">
              <p style="font-size: 16px; line-height: 24px;">Hello,</p>
              <p style="font-size: 16px; line-height: 24px;">You requested to reset your password. Use the following OTP to proceed:</p>
              
              <div style="margin: 32px 0; text-align: center;">
                <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #6366f1; padding: 20px; background-color: #f5f3ff; border-radius: 12px; display: inline-block; border: 1px solid #ddd6fe;">
                  ${otp}
                </div>
                <p style="margin-top: 16px; font-size: 14px; color: #6b7280;">This OTP will expire in 10 minutes.</p>
              </div>
              
              <p style="font-size: 14px; color: #9ca3af; text-align: center;">If you didn't request this, please ignore this email.</p>
              
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="font-weight: 600; color: #374151;">The WombCare Team</p>
              </div>
            </div>
          </div>
        </div>
      `,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to send OTP mail:', error);
    throw error;
  }
};
