import { Router } from 'express';
import { UserProfileController, userProfileSchema, updateProfileSchema } from '../controllers/userProfileController';
import { UserProfileService } from '../services/userProfileService';
import { UserProfileRepository } from '../repositories/userProfileRepository';
import { SupabaseAdapter } from '../database/supabaseAdapter';
import { validate } from '../middleware/validate';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();

// Dependency Injection
const dbAdapter = new SupabaseAdapter();
const userProfileRepository = new UserProfileRepository(dbAdapter);
const userProfileService = new UserProfileService(userProfileRepository);
const userProfileController = new UserProfileController(userProfileService);

// Routes
router.post('/', validate(userProfileSchema), userProfileController.create);
router.get('/:id', userProfileController.getById);
router.patch('/:id', validate(updateProfileSchema), userProfileController.update);

// Admin bulk access if needed
router.get('/', adminAuth, async (req, res, next) => {
    // Optional: implement list all profiles
});

export default router;
