import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/adminService';

export class AdminController {
  constructor(private adminService: AdminService) {}

  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.adminService.getStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const MAX_LIMIT = 100;
      const safeLimit = Math.min(limit, MAX_LIMIT);

      const result = await this.adminService.getUsers(page, safeLimit);
      
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  };
}
