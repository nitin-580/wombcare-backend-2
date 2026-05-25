import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { DoctorRepository } from '../repositories/doctorRepository';
import { generateOtp, sendOtpMail } from '../lib/otpService';

export class AuthController {
  constructor(private doctorRepo: DoctorRepository) {}

  forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const user = await this.doctorRepo.findByEmail(email);

      if (!user) {
        // We return success anyway for security to prevent email enumeration
        res.status(200).json({ success: true, message: 'If this email exists, an OTP has been sent.' });
        return;
      }

      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

      await this.doctorRepo.saveOtp(email, otp, expiresAt);
      await sendOtpMail(email, otp);

      res.status(200).json({ success: true, message: 'OTP sent successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  verifyOtp = async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      const isValid = await this.doctorRepo.verifyOtp(email, otp);

      if (!isValid) {
        res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        return;
      }

      res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const { email, otp, newPassword } = req.body;
      
      // Verify OTP again to be sure
      const isValid = await this.doctorRepo.verifyOtp(email, otp);
      if (!isValid) {
        res.status(400).json({ success: false, message: 'Invalid token/OTP' });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.doctorRepo.updatePassword(email, hashedPassword);

      res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
