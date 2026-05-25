import { Request, Response, NextFunction } from 'express';
import { CareerService } from '../services/careerService';

export class CareerController {
  constructor(private careerService: CareerService) {}

  createCareer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const career = await this.careerService.createCareer(req.body);
      res.status(201).json({
        success: true,
        data: career
      });
    } catch (error) {
      next(error);
    }
  };

  getCareer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const career = await this.careerService.getCareerById(id as string);
      res.json({
        success: true,
        data: career
      });
    } catch (error) {
      next(error);
    }
  };

  getCareers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.careerService.getCareers(page, limit);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  };

  updateCareer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const career = await this.careerService.updateCareer(id as string, req.body);
      res.json({
        success: true,
        data: career
      });
    } catch (error) {
      next(error);
    }
  };

  deleteCareer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.careerService.deleteCareer(id as string);
      res.json({
        success: true,
        message: 'Career deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}
