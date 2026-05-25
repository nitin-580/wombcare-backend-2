import { Router } from 'express';
import { CareerController } from '../controllers/careerController';
import { CareerService } from '../services/careerService';
import { CareerRepository } from '../repositories/careerRepository';
import { SupabaseAdapter } from '../database/supabaseAdapter';

const router = Router();

// Dependency Injection
const dbAdapter = new SupabaseAdapter();
const careerRepository = new CareerRepository(dbAdapter);
const careerService = new CareerService(careerRepository);
const careerController = new CareerController(careerService);

// Public Routes
router.get('/', careerController.getCareers);
router.get('/:id', careerController.getCareer);

export default router;
