import { Router } from 'express';
import { askWombCareAI, generateAIInsights } from '../controllers/aiController';

const router = Router();

// Route for WombCare AI Chat completions
router.post('/', askWombCareAI);

// Route for WombCare AI dynamic insights generation
router.post('/insights', generateAIInsights);

export default router;
