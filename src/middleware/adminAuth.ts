import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-admin-api-key'] || req.query.apiKey;

  if (!apiKey || apiKey !== env.ADMIN_API_KEY) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing API key',
    });
    return;
  }

  next();
};
