import { Router } from 'express';
import { DietPlanController, trackMealSchema } from '../controllers/dietPlanController';
import { DietPlanService } from '../services/dietPlanService';
import { DietPlanRepository } from '../repositories/dietPlanRepository';
import { SupabaseAdapter } from '../database/supabaseAdapter';
import { StorageService } from '../services/storageService';
import { validate } from '../middleware/validate';

const router = Router();
const dbAdapter = new SupabaseAdapter();
const repository = new DietPlanRepository(dbAdapter);
const storageService = new StorageService();
const service = new DietPlanService(repository);
const controller = new DietPlanController(service, storageService);

// Public/User Routes (Mapped under /api/diet-plans/* in index.ts)
router.get('/user/:userId', controller.getActivePlan);
router.post('/user/:userId/track', validate(trackMealSchema), controller.trackMeal);
router.get('/user/:userId/reports', controller.getWeeklyReport);
router.get('/user/:userId/history', controller.getMealHistory);
router.get('/foods', controller.searchFoods);

export default router;
