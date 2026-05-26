import { Request, Response, NextFunction } from 'express';
import { ClassService } from '../services/classService';
import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required'),
  }),
});

export const createClassSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    type: z.enum(['live', 'recorded']),
    thumbnailUrl: z.string().min(1, 'Thumbnail URL is required'),
    videoUrl: z.string().min(1, 'YouTube video URL is required'),
    googleMeetLink: z.string().optional().or(z.literal('')),
    scheduledAt: z.string().optional(),
    instructorName: z.string().min(1, 'Instructor name is required'),
    duration: z.number().int().positive('Duration must be positive'),
    categoryId: z.string().uuid('Invalid category ID'),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const updateClassSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    type: z.enum(['live', 'recorded']).optional(),
    thumbnailUrl: z.string().optional(),
    videoUrl: z.string().optional(),
    googleMeetLink: z.string().optional().or(z.literal('')),
    scheduledAt: z.string().optional(),
    instructorName: z.string().optional(),
    duration: z.number().int().positive('Duration must be positive').optional(),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const updatePlacementSchema = z.object({
  body: z.object({
    classId: z.string().uuid('Invalid class ID').optional().or(z.literal('')).or(z.literal(null)),
    isActive: z.boolean().optional(),
  }),
});

export const recordAttendanceSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID is required'),
    classId: z.string().uuid('Invalid class ID'),
    joinedAt: z.string().optional(),
    leftAt: z.string().optional(),
    watchDuration: z.number().int().nonnegative().optional(),
    interactionJoined: z.boolean().optional(),
  }),
});

export class ClassController {
  constructor(private classService: ClassService) {}

  // ==========================================
  // CATEGORIES SYSTEM
  // ==========================================
  createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = await this.classService.createCategory(req.body);
      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  };

  getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await this.classService.getCategories();
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.classService.deleteCategory(req.params.id as string);
      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // WELLNESS CLASSES
  // ==========================================
  createClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cls = await this.classService.createClass(req.body);
      res.status(201).json({
        success: true,
        data: cls,
      });
    } catch (error) {
      next(error);
    }
  };

  getClasses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, categoryId, isFeatured, isActive } = req.query;
      const filters: any = {};
      if (type) filters.type = type as 'live' | 'recorded';
      if (categoryId) filters.categoryId = categoryId as string;
      if (isFeatured !== undefined) filters.isFeatured = isFeatured === 'true';
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const classes = await this.classService.getClasses(filters);
      res.status(200).json({
        success: true,
        data: classes,
      });
    } catch (error) {
      next(error);
    }
  };

  getClassById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cls = await this.classService.getClassById(req.params.id as string);
      if (!cls) {
        res.status(404).json({
          success: false,
          message: 'Wellness class not found',
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: cls,
      });
    } catch (error) {
      next(error);
    }
  };

  updateClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cls = await this.classService.updateClass(req.params.id as string, req.body);
      res.status(200).json({
        success: true,
        data: cls,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteClass = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.classService.deleteClass(req.params.id as string);
      res.status(200).json({
        success: true,
        message: 'Wellness class deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // SIMPLIFIED VIDEO PLACEMENTS
  // ==========================================
  getVideoPlacements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const placements = await this.classService.getVideoPlacements();
      res.status(200).json({
        success: true,
        data: placements,
      });
    } catch (error) {
      next(error);
    }
  };

  updateVideoPlacement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const placement = await this.classService.updateVideoPlacement(req.params.id as string, req.body);
      res.status(200).json({
        success: true,
        data: placement,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // CLASS ATTENDANCE
  // ==========================================
  recordAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const attendance = await this.classService.recordAttendance(req.body);
      res.status(200).json({
        success: true,
        data: attendance,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // CLASS HISTORY
  // ==========================================
  getUserHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const history = await this.classService.getUserHistory(req.params.userId as string);
      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // ADMIN ANALYTICS
  // ==========================================
  getAdminAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const analytics = await this.classService.getAdminAnalytics();
      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  };
}
