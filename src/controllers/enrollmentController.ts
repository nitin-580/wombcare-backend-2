import { Request, Response, NextFunction } from 'express';
import { EnrollmentService } from '../services/enrollmentService';
import { z } from 'zod';

export const enrollmentSchema = z.object({
  body: z.object({
    fullName: z.string().default('Anonymous'),
    age: z.coerce.number().default(25),
    phone: z.string().default('Not provided'),
    city: z.string().optional().default(''),
    symptoms: z.string().optional().default(''),
    duration: z.string().optional().default(''),
    plan: z.string().optional().default('starter'),
    consultationTime: z.string().optional().default(''),
    notes: z.string().optional().default(''),
  }),
});

export class EnrollmentController {
  constructor(private enrollmentService: EnrollmentService) {}

  enroll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const enrollment = await this.enrollmentService.enroll(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Enrollment submitted successfully',
        data: enrollment
      });
    } catch (error) {
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const result = await this.enrollmentService.getEnrollments(page, limit);
      
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  };
}
