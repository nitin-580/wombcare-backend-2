import { Router } from 'express';
import { BlogController } from '../controllers/blogController';
import { BlogService } from '../services/blogService';
import { BlogRepository } from '../repositories/blogRepository';
import { SupabaseAdapter } from '../database/supabaseAdapter';

const router = Router();

// Dependency Injection Setup
const dbAdapter = new SupabaseAdapter();
const blogRepository = new BlogRepository(dbAdapter);
const blogService = new BlogService(blogRepository);
const blogController = new BlogController(blogService);

// Public routes for viewers
router.get('/', blogController.getBlogs);
router.get('/:id', blogController.getBlog);
router.get('/slug/:slug', blogController.getBlogBySlug);

export default router;
