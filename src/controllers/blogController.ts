import { Request, Response, NextFunction } from 'express';
import { BlogService } from '../services/blogService';

export class BlogController {
  constructor(private blogService: BlogService) {}

  createBlog = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const blog = await this.blogService.createBlog(req.body);
      res.status(201).json({
        success: true,
        data: blog
      });
    } catch (error) {
      next(error);
    }
  };

  getBlog = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const blog = await this.blogService.getBlogById(id as string);
      res.json({
        success: true,
        data: blog
      });
    } catch (error) {
      next(error);
    }
  };

  getBlogBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = req.params;
      const blog = await this.blogService.getBlogBySlug(slug as string);
      res.json({
        success: true,
        data: blog
      });
    } catch (error) {
      next(error);
    }
  };

  getBlogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.blogService.getBlogs(page, limit);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  };

  updateBlog = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const blog = await this.blogService.updateBlog(id as string, req.body);
      res.json({
        success: true,
        data: blog
      });
    } catch (error) {
      next(error);
    }
  };

  deleteBlog = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await this.blogService.deleteBlog(id as string);
      res.json({
        success: true,
        message: 'Blog deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };
}
