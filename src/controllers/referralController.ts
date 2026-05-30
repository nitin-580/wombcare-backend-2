import { Request, Response } from 'express';
import { ReferralService } from '../services/referralService';
import { Referral } from '../database/interfaces';

export class ReferralController {
  constructor(private referralService: ReferralService) {}

  createReferral = async (req: Request, res: Response): Promise<void> => {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        res.status(401).json({ success: false, message: 'Unauthorized: Doctor credentials missing' });
        return;
      }

      const { patientName, mobile, email, problem } = req.body;
      if (!patientName || !mobile) {
        res.status(400).json({ success: false, message: 'patientName and mobile are required fields' });
        return;
      }

      const referral = await this.referralService.createReferral({
        patientName,
        mobile,
        email: email || '',
        problem,
        doctorId
      });

      res.status(201).json({
        success: true,
        message: 'Referral registered successfully',
        referral
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getDoctorReferrals = async (req: Request, res: Response): Promise<void> => {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const referrals = await this.referralService.getDoctorReferrals(doctorId);
      res.status(200).json({
        success: true,
        total: referrals.length,
        referrals
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getReferralById = async (req: Request, res: Response): Promise<void> => {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const referral = await this.referralService.getReferralById(id as string, doctorId);
      res.status(200).json({
        success: true,
        referral
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getAdminReferrals = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const doctorId = req.query.doctorId as string;
      const search = req.query.search as string;

      const result = await this.referralService.getPaginatedReferrals({
        page,
        limit,
        status,
        doctorId,
        search
      });

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  updateReferralStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        res.status(400).json({ success: false, message: 'status is required' });
        return;
      }

      const updated = await this.referralService.updateReferralStatus(id as string, status);
      res.status(200).json({
        success: true,
        message: 'Referral status updated successfully',
        referral: updated
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  convertReferral = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { email } = req.body;
      const result = await this.referralService.convertReferralToPatient(id as string, email);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getReferralPatientHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { referredId } = req.params;
      const data = await this.referralService.getReferralPatientHistory(referredId as string, doctorId);
      res.status(200).json({
        success: true,
        ...data
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  setUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, role } = req.body;
      if (!email || !role) {
        res.status(400).json({ success: false, message: 'email and role are required' });
        return;
      }
      await this.referralService.setUserRole(email, role);
      res.status(200).json({ success: true, message: `Role updated successfully for ${email}` });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
