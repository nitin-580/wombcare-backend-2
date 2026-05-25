import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { AdminService } from '../services/adminService';
import { UserRepository } from '../repositories/userRepository';
import { SupabaseAdapter } from '../database/supabaseAdapter';
import { adminAuth } from '../middleware/adminAuth';
import { BlogController } from '../controllers/blogController';
import { BlogService } from '../services/blogService';
import { BlogRepository } from '../repositories/blogRepository';
import { CareerController } from '../controllers/careerController';
import { CareerService } from '../services/careerService';
import { CareerRepository } from '../repositories/careerRepository';
import { UploadController } from '../controllers/uploadController';
import { StorageService } from '../services/storageService';
import { EnrollmentController } from '../controllers/enrollmentController';
import { EnrollmentService } from '../services/enrollmentService';
import { EnrollmentRepository } from '../repositories/enrollmentRepository';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

// Dependency Injection Setup
const dbAdapter = new SupabaseAdapter();
const userRepository = new UserRepository(dbAdapter);
const enrollmentRepository = new EnrollmentRepository(dbAdapter);

const adminService = new AdminService(userRepository, enrollmentRepository);
const adminController = new AdminController(adminService);

const blogRepository = new BlogRepository(dbAdapter);
const blogService = new BlogService(blogRepository);
const blogController = new BlogController(blogService);

const careerRepository = new CareerRepository(dbAdapter);
const careerService = new CareerService(careerRepository);
const careerController = new CareerController(careerService);

const storageService = new StorageService();
const uploadController = new UploadController(storageService);

const enrollmentService = new EnrollmentService(enrollmentRepository);
const enrollmentController = new EnrollmentController(enrollmentService);

// Apply admin authentication middleware to all admin routes
router.use(adminAuth);

// Admin stats and users
router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);

// Admin blog CRUD
router.get('/blogs', blogController.getBlogs);
router.get('/blogs/:id', blogController.getBlog);
router.post('/blogs', blogController.createBlog);
router.patch('/blogs/:id', blogController.updateBlog);
router.delete('/blogs/:id', blogController.deleteBlog);

// Admin Media Upload
router.post('/upload', upload.single('image'), uploadController.uploadImage);

// Admin Career management
router.get('/careers', careerController.getCareers);
router.get('/careers/:id', careerController.getCareer);
router.post('/careers', careerController.createCareer);
router.patch('/careers/:id', careerController.updateCareer);
router.delete('/careers/:id', careerController.deleteCareer);

// Admin Enrollment management
router.get('/enrollments', enrollmentController.getAll);

export default router;
