import { Request, Response, NextFunction } from 'express';
import { EarlyAccessService } from '../services/earlyAccessService';
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(8, 'Phone number is required'),
    age: z.number().min(13, 'Must be at least 13 years old').max(120),
    weight: z.number().positive('Weight must be positive'),
    cycleRegularity: z.string().min(1, 'Cycle regularity is required'),
    symptoms: z.string(),
    country: z.string().min(2, 'Country is required'),
    source: z.string().min(1, 'Source is required'),
  }),
});

export class EarlyAccessController {
  constructor(private earlyAccessService: EarlyAccessService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.earlyAccessService.registerUser(req.body);
      
      res.status(201).json({
        success: true,
        message: 'You are on the early access list',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };
}
