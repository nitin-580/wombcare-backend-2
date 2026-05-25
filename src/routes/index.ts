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

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
