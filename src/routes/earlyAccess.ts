import { Router } from 'express';
import { EarlyAccessController, registerSchema } from '../controllers/earlyAccessController';
import { EarlyAccessService } from '../services/earlyAccessService';
import { UserRepository } from '../repositories/userRepository';
import { SupabaseAdapter } from '../database/supabaseAdapter';
import { validate } from '../middleware/validate';
import { signupLimiter } from '../middleware/rateLimiter';

const router = Router();

// Dependency Injection Setup
const dbAdapter = new SupabaseAdapter();
const userRepository = new UserRepository(dbAdapter);
const earlyAccessService = new EarlyAccessService(userRepository);
const earlyAccessController = new EarlyAccessController(earlyAccessService);

router.post(
  '/',
  signupLimiter,
  validate(registerSchema),
  earlyAccessController.register
);

export default router;
