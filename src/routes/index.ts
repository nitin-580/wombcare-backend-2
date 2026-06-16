import { Router } from 'express';
import earlyAccessRoutes from './earlyAccess';
import adminRoutes from './admin';
import blogRoutes from './blogRoutes';
import careerRoutes from './careerRoutes';
import doctorRoutes from './doctorRoutes';
import enrollmentRoutes from './enrollmentRoutes';
import userProfileRoutes from './userProfileRoutes';
import appointmentRoutes from './appointmentRoutes';
import authRoutes from './authRoutes';
import classRoutes from './classRoutes';
import referralRoutes from './referralRoutes';
import aiRoutes from './aiRoutes';
import bannerRoutes from './bannerRoutes';
import paymentRoutes from './paymentRoutes';
import dietPlanRoutes from './dietPlanRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/early-access', earlyAccessRoutes);
router.use('/admin', adminRoutes);
router.use('/blogs', blogRoutes);
router.use('/careers', careerRoutes);
router.use('/doctors', doctorRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/profiles', userProfileRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/classes', classRoutes);

// Duplicate registration to support both /api/classes/jitsi/webhook and /api/jitsi/webhook
import { ClassController } from '../controllers/classController';
import { ClassService } from '../services/classService';
import { ClassRepository } from '../repositories/classRepository';
import { SupabaseAdapter } from '../database/supabaseAdapter';
const indexDbAdapter = new SupabaseAdapter();
const indexClassRepository = new ClassRepository(indexDbAdapter);
const indexClassService = new ClassService(indexClassRepository);
const indexClassController = new ClassController(indexClassService);
router.post('/jitsi/webhook', indexClassController.handleJitsiWebhook);

router.use('/ai', aiRoutes);
router.use('/banners', bannerRoutes);
router.use('/payment', paymentRoutes);
router.use('/diet-plans', dietPlanRoutes);
router.use('/', referralRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
