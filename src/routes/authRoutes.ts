import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { DoctorRepository } from '../repositories/doctorRepository';
import { SupabaseAdapter } from '../database/supabaseAdapter';

const router = Router();
const dbAdapter = new SupabaseAdapter();
const doctorRepo = new DoctorRepository(dbAdapter);
const authController = new AuthController(doctorRepo);

router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOtp);
router.post('/reset-password', authController.resetPassword);

export default router;
