import { Router } from 'express';
import { BannerController } from '../controllers/bannerController';
import { BannerService } from '../services/bannerService';
import { BannerRepository } from '../repositories/bannerRepository';
import { SupabaseAdapter } from '../database/supabaseAdapter';

const router = Router();

// Dependency Injection Setup
const dbAdapter = new SupabaseAdapter();
const bannerRepository = new BannerRepository(dbAdapter);
const bannerService = new BannerService(bannerRepository);
const bannerController = new BannerController(bannerService);

// Public route to fetch active banners
router.get('/', bannerController.getActiveBanners);

export default router;
