import { Router } from 'express';
import { AppointmentController, scheduleAppointmentSchema } from '../controllers/appointmentController';
import { AppointmentService } from '../services/appointmentService';
import { AppointmentRepository } from '../repositories/appointmentRepository';
import { UserProfileRepository } from '../repositories/userProfileRepository';
import { SupabaseAdapter } from '../database/supabaseAdapter';
import { validate } from '../middleware/validate';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();
const dbAdapter = new SupabaseAdapter();
const repository = new AppointmentRepository(dbAdapter);
const profileRepo = new UserProfileRepository(dbAdapter);
const service = new AppointmentService(repository);
const controller = new AppointmentController(service, profileRepo);

// Public/User Routes
router.post('/', validate(scheduleAppointmentSchema), controller.schedule);
router.get('/user/:userId', controller.getByUser);
router.patch('/:id/cancel', controller.cancel);

// Admin Routes
router.get('/admin/all', adminAuth, controller.getAllAdmin);
router.patch('/admin/:id/status', adminAuth, controller.updateStatusAdmin);

export default router;
