import { Router } from 'express';
import { ReferralController } from '../controllers/referralController';
import { ReferralService } from '../services/referralService';
import { ReferralRepository } from '../repositories/referralRepository';
import { DoctorRepository } from '../repositories/doctorRepository';
import { PatientRepository } from '../repositories/patientRepository';
import { UserProfileRepository } from '../repositories/userProfileRepository';
import { SupabaseAdapter } from '../database/supabaseAdapter';
import { doctorAuth } from '../middleware/doctorAuth';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

// Dependency Injection Instantiation
const dbAdapter = new SupabaseAdapter();
const referralRepo = new ReferralRepository(dbAdapter);
const doctorRepo = new DoctorRepository(dbAdapter);
const patientRepo = new PatientRepository(dbAdapter);
const profileRepo = new UserProfileRepository(dbAdapter);

const referralService = new ReferralService(referralRepo, doctorRepo, patientRepo, profileRepo);
const referralController = new ReferralController(referralService);

// --- DOCTOR ENDPOINTS ---
// Create a new referral
router.post('/referrals', doctorAuth, referralController.createReferral);

// View all referrals referred by the logged-in doctor
router.get('/referrals/my-referrals', doctorAuth, referralController.getDoctorReferrals);

// View a specific referral's details
router.get('/referrals/:id', doctorAuth, referralController.getReferralById);

// Securely access full patient history of a converted referred patient
router.get('/doctor/patient-history/:referredId', doctorAuth, referralController.getReferralPatientHistory);


// --- ADMIN ENDPOINTS ---
// View all referrals globally with filtering and search
router.get('/admin/referrals', adminAuth, referralController.getAdminReferrals);

// Update a referral status manually
router.patch('/admin/referrals/:id/status', adminAuth, referralController.updateReferralStatus);

// Convert a referral into an active patient account
router.post('/admin/referrals/convert/:id', adminAuth, referralController.convertReferral);

// Administrative role management
router.post('/admin/users/role', adminAuth, referralController.setUserRole);

export default router;
