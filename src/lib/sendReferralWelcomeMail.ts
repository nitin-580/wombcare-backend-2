import { resend } from './resend';

export async function sendReferralWelcomeMail(email: string, name: string, passwordString: string) {
  console.log(`[Email] Sending referral onboarding mail to: ${email}`);
  const result = await resend.emails.send({
    from: 'WombCare <support@wombcare.in>',
    to: email,
    subject: 'Your WombCare Patient Account is Ready! ✨',
    html: `
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; color: #1a1a1a; border-radius: 16px; border: 1px solid #f0f0f0;">
        <div style="margin-bottom: 32px;">
          <h1 style="color: #6d28d9; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">WombCare</h1>
        </div>
        
        <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #111827;">Your WombCare Patient Account is Ready, ${name}! ✨</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
          Your doctor has referred you to WombCare. We have successfully set up your secure patient account.
        </p>
        
        <div style="background-color: #f5f3ff; border-left: 4px solid #6d28d9; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
          <h3 style="margin-top: 0; color: #6d28d9; font-size: 18px;">Your Credentials</h3>
          <p style="font-size: 15px; margin: 8px 0; color: #374151;"><strong>Login Email:</strong> ${email}</p>
          <p style="font-size: 15px; margin: 8px 0; color: #374151;"><strong>Temporary Password:</strong> <code style="background-color: #e0e7ff; padding: 3px 6px; border-radius: 4px; font-size: 14px;">${passwordString}</code></p>
          <p style="font-size: 13px; color: #6b7280; margin: 12px 0 0 0; font-style: italic;">We recommend changing this password after your first login.</p>
        </div>

        <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 12px;">Next Steps:</h3>
        <ol style="font-size: 15px; line-height: 1.6; color: #4b5563; padding-left: 20px; margin-bottom: 32px;">
          <li style="margin-bottom: 8px;">Download the <strong>WombCare</strong> app on your mobile device.</li>
          <li style="margin-bottom: 8px;">Log in using your email and the temporary password above.</li>
          <li style="margin-bottom: 8px;">Complete your health profile and access your care plan and calendar!</li>
        </ol>
        
        <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 32px 0;">
        
        <p style="font-size: 14px; color: #9ca3af; margin: 0;">
          Warm regards,<br>
          <strong>The WombCare Team</strong>
        </p>
      </div>
    `,
  });
  console.log(`[Email] Referral onboarding mail sent successfully to: ${email}`);
  return result;
}

export async function sendReferralInformativeMail(email: string, name: string, doctorName: string) {
  console.log(`[Email] Sending referral informative mail to: ${email}`);
  const result = await resend.emails.send({
    from: 'WombCare <support@wombcare.in>',
    to: email,
    subject: 'You have been referred to WombCare! ✨',
    html: `
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; color: #1a1a1a; border-radius: 16px; border: 1px solid #f0f0f0;">
        <div style="margin-bottom: 32px;">
          <h1 style="color: #6d28d9; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">WombCare</h1>
        </div>
        
        <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 16px; color: #111827;">Hello ${name}! ✨</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">
          We are pleased to inform you that <strong>Dr. ${doctorName}</strong> has referred you to WombCare, a dedicated coaching platform for PCOD/PCOS lifestyle management.
        </p>
        
        <div style="background-color: #f5f3ff; border-left: 4px solid #6d28d9; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
          <p style="margin: 0; font-size: 15px; color: #374151;">
            Our team of dedicated coaches and lifestyle experts will get in touch with you shortly to assist with your onboarding.
          </p>
        </div>

        <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 32px;">
          If you have any immediate questions, feel free to reply directly to this email.
        </p>
        
        <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 32px 0;">
        
        <p style="font-size: 14px; color: #9ca3af; margin: 0;">
          Warm regards,<br>
          <strong>The WombCare Team</strong>
        </p>
      </div>
    `,
  });
  console.log(`[Email] Referral informative mail sent successfully to: ${email}`);
  return result;
}
