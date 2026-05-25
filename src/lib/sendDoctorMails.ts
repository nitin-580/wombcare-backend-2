import { resend } from './resend';

export const sendDoctorApplicationMail = async (email: string, name: string, registrationNumber: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'WombCare <support@wombcare.in>',
      to: [email],
      subject: 'Doctor Partnership Application - WombCare',
      html: `
        <div style="font-family: 'Inter', sans-serif; background-color: #f9fafb; padding: 40px; color: #1f2937;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Application Received</h1>
            </div>
            <div style="padding: 32px;">
              <p style="font-size: 16px; line-height: 24px;">Dear Dr. ${name},</p>
              <p style="font-size: 16px; line-height: 24px;">Thank you for your interest in joining the WombCare network. We have received your application and medical registration details (Reg No: ${registrationNumber}).</p>
              <p style="font-size: 16px; line-height: 24px;">Our team is currently reviewing your profile. You will receive an update once the verification process is complete.</p>
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #6b7280; font-size: 14px;">If you have any questions, feel free to reply to this email.</p>
                <p style="font-weight: 600; color: #374151; margin-top: 8px;">The WombCare Team</p>
              </div>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending application mail:', error);
      throw error;
    }

    console.log(`[Email] Doctor application mail sent to: ${email}`);
    return data;
  } catch (error) {
    console.error('Failed to send application mail:', error);
    throw error;
  }
};

export const sendDoctorApprovalMail = async (email: string, name: string, tempPassword: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'WombCare <support@wombcare.in>',
      to: [email],
      subject: 'Welcome to WombCare - Application Approved!',
      html: `
        <div style="font-family: 'Inter', sans-serif; background-color: #fdf2f8; padding: 40px; color: #1f2937;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Application Approved</h1>
            </div>
            <div style="padding: 32px;">
              <p style="font-size: 18px; font-weight: 600; color: #be185d;">Congratulations Dr. ${name}!</p>
              <p style="font-size: 16px; line-height: 24px; margin-top: 16px;">We are thrilled to inform you that your doctor partnership application has been approved. You are now officially part of the WombCare expert network.</p>
              
              <div style="margin: 24px 0; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
                <p style="margin: 0; font-size: 14px; color: #64748b;">Your login credentials:</p>
                <p style="margin: 8px 0 0; font-size: 16px;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 4px 0 0; font-size: 16px;"><strong>Temporary Password:</strong> ${tempPassword}</p>
                <p style="margin: 12px 0 0; font-size: 12px; color: #94a3b8;">*Please change your password after your first login.</p>
              </div>

              <div style="margin-top: 32px; text-align: center;">
                <a href="https://wombcare.in/login" style="background-color: #be185d; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Go to Dashboard</a>
              </div>
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #6b7280; font-size: 14px;">Welcome aboard!</p>
                <p style="font-weight: 600; color: #374151; margin-top: 8px;">The WombCare Team</p>
              </div>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending approval mail:', error);
      throw error;
    }

    console.log(`[Email] Doctor approval mail sent to: ${email}`);
    return data;
  } catch (error) {
    console.error('Failed to send approval mail:', error);
    throw error;
  }
};
