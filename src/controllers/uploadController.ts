import { Request, Response, NextFunction } from 'express';
import { StorageService } from '../services/storageService';

export class UploadController {
  constructor(private storageService: StorageService) {}

  uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new Error('No file uploaded');
      }

      const publicUrl = await this.storageService.uploadImage(req.file);
      
      res.status(200).json({
        success: true,
        data: {
          url: publicUrl
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
