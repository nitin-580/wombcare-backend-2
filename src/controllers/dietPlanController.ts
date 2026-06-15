import { Request, Response, NextFunction } from 'express';
import { DietPlanService } from '../services/dietPlanService';
import { StorageService } from '../services/storageService';
import { z } from 'zod';

export const trackMealSchema = z.object({
  body: z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    day: z.number().int().min(1).max(7),
    mealIndex: z.number().int().min(0),
    mealName: z.string().min(1),
    status: z.enum(['completed', 'delayed', 'skipped']),
    completionTime: z.string().optional(),
  }),
});

export const createDietPlanSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().optional(),
    patientAge: z.string().optional(),
    patientHeight: z.string().optional(),
    patientWeight: z.string().optional(),
    patientGoal: z.string().optional(),
    patientDiet: z.string().optional(),
    dietData: z.array(z.any()).min(1),
    foodsToAvoid: z.array(z.string()).optional(),
    dailyTargets: z.array(z.any()).optional(),
    pdfUrl: z.string().optional()
  }),
});

export class DietPlanController {
  constructor(
    private dietPlanService: DietPlanService,
    private storageService: StorageService
  ) {}

  // USER / CLIENT ENDPOINTS

  getActivePlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId as string;
      const plan = await this.dietPlanService.getDietPlanByUserId(userId);
      res.status(200).json({
        success: true,
        data: plan
      });
    } catch (error) {
      next(error);
    }
  };

  trackMeal = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId as string;
      const { date, day, mealIndex, mealName, status, completionTime } = req.body;
      const log = await this.dietPlanService.trackMeal({
        userId,
        date,
        day,
        mealIndex,
        mealName,
        status,
        completionTime
      });
      res.status(200).json({
        success: true,
        message: 'Meal tracking updated successfully',
        data: log
      });
    } catch (error) {
      next(error);
    }
  };

  getWeeklyReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId as string;
      const endDate = req.query.endDate ? String(req.query.endDate) : undefined;
      const report = await this.dietPlanService.getWeeklyReport(userId, endDate);
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      next(error);
    }
  };

  getMealHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.userId as string;
      const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
      const endDate = req.query.endDate ? String(req.query.endDate) : undefined;
      if (!startDate || !endDate) {
        throw new Error('startDate and endDate query parameters are required');
      }
      const history = await this.dietPlanService.getMealLogsHistory(
        userId,
        startDate,
        endDate
      );
      res.status(200).json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  };

  searchFoods = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = req.query.query ? String(req.query.query) : '';
      const foods = await this.dietPlanService.searchFoods(query);
      res.status(200).json({
        success: true,
        data: foods
      });
    } catch (error) {
      next(error);
    }
  };

  // ADMIN ENDPOINTS

  listPlansAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page ? String(req.query.page) : '1') || 1;
      const limit = parseInt(req.query.limit ? String(req.query.limit) : '10') || 10;
      const result = await this.dietPlanService.getPaginatedDietPlans(page, limit);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit
        }
      });
    } catch (error) {
      next(error);
    }
  };

  createPlanAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plan = await this.dietPlanService.createDietPlan(req.body);
      res.status(201).json({
        success: true,
        message: 'Diet plan created successfully',
        data: plan
      });
    } catch (error) {
      next(error);
    }
  };

  updatePlanAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const plan = await this.dietPlanService.updateDietPlan(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Diet plan updated successfully',
        data: plan
      });
    } catch (error) {
      next(error);
    }
  };

  deletePlanAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await this.dietPlanService.deleteDietPlan(id);
      res.status(200).json({
        success: true,
        message: 'Diet plan deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  uploadPdfAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new Error('No PDF file uploaded');
      }

      const publicUrl = await this.storageService.uploadImage(req.file, 'diet-plans');
      
      res.status(200).json({
        success: true,
        message: 'PDF uploaded successfully',
        data: {
          url: publicUrl
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
