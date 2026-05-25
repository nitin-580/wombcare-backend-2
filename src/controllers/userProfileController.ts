import { Request, Response, NextFunction } from 'express';
import { UserProfileService } from '../services/userProfileService';
import { z } from 'zod';

export const userProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    age: z.number().optional(),
    activePlan: z.string().optional(),
    planStatus: z.string().optional(),
    waterIntake: z.number().optional(),
    targetWater: z.number().optional(),
    caloriesTarget: z.number().optional(),
    proteinTarget: z.number().optional(),
    symptoms: z.array(z.string()).optional(),
    bmi: z.number().optional(),
    wellnessScore: z.number().optional(),
    personalNotes: z.string().optional(),
    doctorNote: z.string().optional(),
    id: z.string().optional(),
    profileCompleted: z.boolean().optional(),
    cycleStartDate: z.string().optional(),
    weight: z.number().optional(),
    mood: z.string().optional(),
    moodDate: z.string().optional(),
    waterIntakeDate: z.string().optional(),
    isPeriodTrackerEnabled: z.boolean().optional(),
    wellnessGoal: z.string().optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    age: z.number().optional(),
    isActive: z.boolean().optional(),
    lastSeen: z.string().optional(),
    activePlan: z.string().optional(),
    planStatus: z.string().optional(),
    nextAppointment: z.string().optional(),
    cycleDay: z.number().optional(),
    cycleLength: z.number().optional(),
    nextPeriodDate: z.string().optional(),
    waterIntake: z.number().optional(),
    targetWater: z.number().optional(),
    caloriesTarget: z.number().optional(),
    proteinTarget: z.number().optional(),
    symptoms: z.array(z.string()).optional(),
    bmi: z.number().optional(),
    wellnessScore: z.number().optional(),
    personalNotes: z.string().optional(),
    doctorNote: z.string().optional(),
    profileCompleted: z.boolean().optional(),
    cycleStartDate: z.string().optional(),
    weight: z.number().optional(),
    mood: z.string().optional(),
    moodDate: z.string().optional(),
    waterIntakeDate: z.string().optional(),
    isPeriodTrackerEnabled: z.boolean().optional(),
    wellnessGoal: z.string().optional(),
  }),
});

export class UserProfileController {
  constructor(private userProfileService: UserProfileService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await this.userProfileService.createProfile(req.body);
      res.status(201).json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await this.userProfileService.getProfile(req.params.id as string);
      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await this.userProfileService.updateProfile(req.params.id as string, req.body);
      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  };
}
