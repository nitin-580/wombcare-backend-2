import { Router } from 'express';
import { EnrollmentController, enrollmentSchema } from '../controllers/enrollmentController';
import { EnrollmentService } from '../services/enrollmentService';
import { EnrollmentRepository } from '../repositories/enrollmentRepository';
import { SupabaseAdapter } from '../database/supabaseAdapter';
import { validate } from '../middleware/validate';
import { signupLimiter } from '../middleware/rateLimiter';

const router = Router();

// Dependency Injection Setup
const dbAdapter = new SupabaseAdapter();
const enrollmentRepository = new EnrollmentRepository(dbAdapter);
const enrollmentService = new EnrollmentService(enrollmentRepository);
const enrollmentController = new EnrollmentController(enrollmentService);

router.post(
  '/',
  signupLimiter,
  validate(enrollmentSchema),
  enrollmentController.enroll
);

router.get(
  '/',
  enrollmentController.getAll
);

export default router;
