import { resend } from './resend';

export const sendAppointmentMail = async (
  email: string, 
  name: string, 
  doctorName: string, 
  date: string, 
  status: 'approved' | 'rejected' | 'completed'
) => {
  try {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const isRejected = status === 'rejected';
    const subject = isRejected 
      ? 'Appointment Status Update - WombCare' 
      : 'Appointment Confirmed - WombCare';

    const { data, error } = await resend.emails.send({
      from: 'WombCare <support@wombcare.in>',
      to: [email],
      subject: subject,
      html: `
        <div style="font-family: 'Inter', sans-serif; background-color: #f9fafb; padding: 40px; color: #1f2937;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background: ${isRejected ? '#ef4444' : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'}; padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">
                ${isRejected ? 'Appointment Update' : 'Appointment Confirmed'}
              </h1>
            </div>
            <div style="padding: 32px;">
              <p style="font-size: 16px; line-height: 24px;">Dear ${name},</p>
              
              ${isRejected ? `
                <p style="font-size: 16px; line-height: 24px;">We regret to inform you that your appointment with <strong>${doctorName}</strong> scheduled for <strong>${formattedDate}</strong> could not be confirmed at this time.</p>
                <p style="font-size: 16px; line-height: 24px;">Please try scheduling another slot or contact support for assistance.</p>
              ` : `
                <p style="font-size: 16px; line-height: 24px;">Your appointment with <strong>${doctorName}</strong> has been successfully confirmed.</p>
                <div style="margin: 24px 0; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                  <p style="margin: 0; font-size: 14px; color: #64748b;">Appointment Details:</p>
                  <p style="margin: 8px 0 0; font-size: 16px;"><strong>Doctor:</strong> ${doctorName}</p>
                  <p style="margin: 4px 0 0; font-size: 16px;"><strong>Date:</strong> ${formattedDate}</p>
                </div>
              `}
              
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #6b7280; font-size: 14px;">If you have any questions, feel free to reply to this email.</p>
                <p style="font-weight: 600; color: #374151; margin-top: 8px;">The WombCare Team</p>
              </div>
            </div>
          </div>
        </div>
      `,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to send appointment mail:', error);
    throw error;
  }
};
