import { Request, Response, NextFunction } from 'express';
import { ClassService } from '../services/classService';
import { SupabaseAdapter } from '../database/supabaseAdapter';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';


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
    instructorId: z.string().optional(),
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
    instructorId: z.string().optional(),
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

  // ==========================================
  // LIVE CHAT SYSTEM
  // ==========================================
  sendChatMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const classIdStr = req.params.classId as string;
      const { message } = req.body;
      const user = req.user; // populated by userOrDoctorAuth middleware

      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!message || message.trim() === '') {
        res.status(400).json({ success: false, message: 'Message content is required' });
        return;
      }

      // Resolve sender name
      let senderName = 'Anonymous';
      const db = new SupabaseAdapter();
      if (user.role === 'doctor') {
        const doc = await db.getDoctorById(user.id);
        senderName = doc ? doc.name : 'Doctor';
      } else if (user.role === 'admin') {
        senderName = 'Admin';
      } else {
        try {
          const profile = await db.getUserProfile(user.id);
          senderName = profile ? profile.name : 'User';
        } catch {
          senderName = 'User';
        }
      }

      const chatMessage = await this.classService.createLiveChatMessage({
        classId: classIdStr,
        userId: user.id,
        senderName,
        senderRole: user.role as 'user' | 'doctor' | 'admin',
        message: message.trim()
      });

      res.status(201).json({
        success: true,
        data: chatMessage
      });
    } catch (error) {
      next(error);
    }
  };

  getChatMessages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const classIdStr = req.params.classId as string;
      const messages = await this.classService.getLiveChatMessages(classIdStr);
      res.status(200).json({
        success: true,
        data: messages
      });
    } catch (error) {
      next(error);
    }
  };

  generateJitsiToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const classId = req.params.id as string;
      const user = req.user;

      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const cls = await this.classService.getClassById(classId);
      if (!cls) {
        res.status(404).json({ success: false, message: 'Class not found' });
        return;
      }

      const isJitsi = cls.videoUrl && cls.videoUrl.startsWith('jitsi:');
      const roomName = isJitsi ? cls.videoUrl.replace('jitsi:', '') : 'default-wombcare-room';

      let userName = 'Participant';
      let userEmail = user.email || '';
      
      const db = new SupabaseAdapter();
      if (user.role === 'doctor' || user.role === 'teacher') {
        const doc = await db.getDoctorById(user.id);
        userName = doc ? doc.name : 'Wellness Coach';
      } else if (user.role === 'admin') {
        userName = 'Administrator';
      } else {
        try {
          const profile = await db.getUserProfile(user.id);
          userName = profile ? profile.name : 'Student';
        } catch {
          userName = 'Student';
        }
      }

      const isModerator = user.role === 'doctor' || user.role === 'teacher' || user.role === 'admin';

      if (isModerator) {
        await this.classService.updateClass(classId, {
          jitsiSessionStatus: 'LIVE'
        });
        console.log(`[DEBUG] Updated class ${classId} state to LIVE for room: ${roomName}`);
      }

      const privateKey = env.JAAS_PRIVATE_KEY.replace(/\\n/g, '\n');
      const kid = env.JAAS_KID;
      const appId = env.JAAS_APP_ID;

      const payload = {
        aud: 'jitsi',
        iss: 'chat',
        sub: appId,
        room: roomName,
        nbf: Math.floor(Date.now() / 1000) - 10,
        exp: Math.floor(Date.now() / 1000) + 7200,
        context: {
          user: {
            name: userName,
            email: userEmail,
            id: user.id,
            avatar: 'https://wombcare.in/assets/logo.png',
            moderator: isModerator
          },
          features: {
            recording: isModerator,
            livestreaming: isModerator,
            'screen-sharing': isModerator
          }
        }
      };

      const token = jwt.sign(payload, privateKey, {
        algorithm: 'RS256',
        keyid: kid,
        header: {
          alg: 'RS256',
          kid: kid,
          typ: 'JWT'
        }
      });

      res.status(200).json({
        success: true,
        appId,
        roomName,
        jwt: token
      });
    } catch (error: any) {
      console.error('Failed to generate Jitsi token:', error);
      next(error);
    }
  };

  handleJitsiWebhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[DEBUG] Jitsi webhook received payload:', JSON.stringify(req.body));
      const { roomName, recordingUrl, url } = req.body;
      
      let roomNameResolved = roomName;
      let urlResolved = recordingUrl || url;
      
      if (req.body.fqn) {
        const parts = req.body.fqn.split('/');
        roomNameResolved = parts[parts.length - 1];
      }
      if (req.body.data) {
        if (req.body.data.recordingUrl) {
          urlResolved = req.body.data.recordingUrl;
        } else if (req.body.data.downloadUrl) {
          urlResolved = req.body.data.downloadUrl;
        }
      }

      if (!roomNameResolved) {
        res.status(400).json({ success: false, message: 'roomName or fqn is required' });
        return;
      }

      const classes = await this.classService.getClasses();
      const matchingClass = classes.find(c => {
        return c.videoUrl === `jitsi:${roomNameResolved}` || (c.videoUrl && c.videoUrl.includes(roomNameResolved));
      });

      if (!matchingClass) {
        console.log(`[DEBUG] No matching class found for roomName: ${roomNameResolved}`);
        res.status(404).json({ success: false, message: `Class with room ${roomNameResolved} not found` });
        return;
      }

      console.log(`[DEBUG] Found matching class: ${matchingClass.title} (${matchingClass.id})`);

      await this.classService.updateClass(matchingClass.id, {
        type: 'recorded',
        videoUrl: urlResolved || matchingClass.videoUrl,
        jitsiSessionStatus: 'COMPLETED',
        jitsiRecordingUrl: urlResolved || undefined
      });

      res.status(200).json({
        success: true,
        message: 'Jitsi recording status updated successfully',
        classId: matchingClass.id,
        recordingUrl: urlResolved
      });
    } catch (error) {
      console.error('Jitsi webhook processing failed:', error);
      next(error);
    }
  };

  getStudentRecordings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const classes = await this.classService.getClasses();
      const completedJitsiClasses = classes.filter(c => {
        return c.jitsiSessionStatus === 'COMPLETED';
      });

      res.status(200).json({
        success: true,
        data: completedJitsiClasses
      });
    } catch (error) {
      next(error);
    }
  };

  getTeacherStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const stats = await this.classService.getTeacherStats(user.id);
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };
}


