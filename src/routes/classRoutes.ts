import { Router } from 'express';
import { 
  ClassController, 
  createCategorySchema, 
  createClassSchema, 
  updateClassSchema, 
  updatePlacementSchema, 
  recordAttendanceSchema 
} from '../controllers/classController';
import { ClassService } from '../services/classService';
import { ClassRepository } from '../repositories/classRepository';
import { SupabaseAdapter } from '../database/supabaseAdapter';
import { validate } from '../middleware/validate';
import { adminAuth } from '../middleware/adminAuth';
import { userOrDoctorAuth } from '../middleware/userOrDoctorAuth';

const router = Router();


// Dependency Injection
const dbAdapter = new SupabaseAdapter();
const classRepository = new ClassRepository(dbAdapter);
const classService = new ClassService(classRepository);
const classController = new ClassController(classService);

// ==========================================
// CATEGORIES ROUTES
// ==========================================
router.get('/categories', classController.getCategories);
router.post('/categories', adminAuth, validate(createCategorySchema), classController.createCategory);
router.delete('/categories/:id', adminAuth, classController.deleteCategory);

// ==========================================
// VIDEO PLACEMENTS ROUTES
// ==========================================
router.get('/placements', classController.getVideoPlacements);
router.patch('/placements/:id', adminAuth, validate(updatePlacementSchema), classController.updateVideoPlacement);

// ==========================================
// CLASS ATTENDANCE ROUTES
// ==========================================
router.post('/attendance', validate(recordAttendanceSchema), classController.recordAttendance);

// ==========================================
// CLASS HISTORY ROUTES
// ==========================================
router.get('/history/:userId', classController.getUserHistory);

// ==========================================
// ADMIN ANALYTICS ROUTES
// ==========================================
router.get('/analytics', adminAuth, classController.getAdminAnalytics);

// ==========================================
// WELLNESS CLASSES ROUTES
// ==========================================
router.get('/', classController.getClasses);
router.get('/teacher/stats', userOrDoctorAuth, classController.getTeacherStats);
router.get('/student/recordings', userOrDoctorAuth, classController.getStudentRecordings);
router.post('/jitsi/webhook', classController.handleJitsiWebhook);
router.get('/:id', classController.getClassById);
router.post('/', adminAuth, validate(createClassSchema), classController.createClass);
router.patch('/:id', adminAuth, validate(updateClassSchema), classController.updateClass);
router.delete('/:id', adminAuth, classController.deleteClass);

router.get('/:id/jitsi-token', userOrDoctorAuth, classController.generateJitsiToken);

// ==========================================
// LIVE CHAT ROUTES
// ==========================================
router.get('/:classId/chat', userOrDoctorAuth, classController.getChatMessages);
router.post('/:classId/chat', userOrDoctorAuth, classController.sendChatMessage);

export default router;

