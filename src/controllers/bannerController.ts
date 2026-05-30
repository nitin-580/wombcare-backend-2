import { Request, Response, NextFunction } from 'express';
import { BannerService } from '../services/bannerService';
import { StorageService } from '../services/storageService';
import { z } from 'zod';

export const createBannerSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    imageUrl: z.string().url('Image URL must be a valid URL'),
    targetUrl: z.string().url('Target URL must be a valid URL').optional(),
    position: z.number().int().default(0),
    isActive: z.boolean().default(true),
  }),
});

export const updateBannerSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    imageUrl: z.string().url('Image URL must be a valid URL').optional(),
    targetUrl: z.string().url('Target URL must be a valid URL').optional().nullable(),
    position: z.number().int().optional(),
    isActive: z.boolean().optional(),
  }),
});

export class BannerController {
  constructor(
    private bannerService: BannerService,
    private storageService?: StorageService
  ) {}

  createBanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const banner = await this.bannerService.createBanner(req.body);
      res.status(201).json({
        success: true,
        data: banner,
      });
    } catch (error) {
      next(error);
    }
  };

  getBanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const banner = await this.bannerService.getBanner(req.params.id as string);
      res.status(200).json({
        success: true,
        data: banner,
      });
    } catch (error) {
      next(error);
    }
  };

  getBanners = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const MAX_LIMIT = 100;
      const safeLimit = Math.min(limit, MAX_LIMIT);

      const result = await this.bannerService.getPaginatedBanners(page, safeLimit);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  getActiveBanners = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const banners = await this.bannerService.getActiveBanners();
      res.status(200).json({
        success: true,
        data: banners,
      });
    } catch (error) {
      next(error);
    }
  };

  updateBanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const banner = await this.bannerService.updateBanner(req.params.id as string, req.body);
      res.status(200).json({
        success: true,
        data: banner,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteBanner = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.bannerService.deleteBanner(req.params.id as string);
      res.status(200).json({
        success: true,
        message: 'Banner deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  uploadBannerImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new Error('No file uploaded');
      }

      if (!this.storageService) {
        throw new Error('Storage service is not configured');
      }

      const publicUrl = await this.storageService.uploadImage(req.file, 'banners');
      res.status(200).json({
        success: true,
        data: {
          url: publicUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
