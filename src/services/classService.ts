import { ClassRepository } from '../repositories/classRepository';
import { 
  ClassCategory, 
  CreateClassCategoryInput, 
  WellnessClass, 
  CreateWellnessClassInput, 
  VideoPlacement, 
  UpdateVideoPlacementInput, 
  ClassAttendance, 
  RecordClassAttendanceInput,
  UserClassHistory
} from '../database/interfaces';

export const extractYoutubeVideoId = (url: string): string => {
  if (!url) return '';
  // Support standard watch?v=, youtu.be, shorts/, embed/
  try {
    if (url.includes('/shorts/')) {
      const parts = url.split('/shorts/');
      return parts[1].split(/[?&#]/)[0];
    }
    if (url.includes('/embed/')) {
      const parts = url.split('/embed/');
      return parts[1].split(/[?&#]/)[0];
    }
    if (url.includes('youtu.be/')) {
      const parts = url.split('youtu.be/');
      return parts[1].split(/[?&#]/)[0];
    }
    const urlObj = new URL(url);
    return urlObj.searchParams.get('v') || '';
  } catch (error) {
    // Basic regex fallback
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  }
};

export class ClassService {
  constructor(private classRepository: ClassRepository) {}

  // ==========================================
  // CATEGORIES SYSTEM
  // ==========================================
  async createCategory(input: { name: string }): Promise<ClassCategory> {
    const slug = input.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    return this.classRepository.createCategory({
      name: input.name,
      slug,
    });
  }

  async getCategories(): Promise<ClassCategory[]> {
    const categories = await this.classRepository.getCategories();
    // Self-healing default seeding if database is empty
    if (categories.length === 0) {
      const defaults = [
        'Yoga', 'Meditation', 'PCOS Care', 'Hormonal Wellness', 
        'Pregnancy Care', 'Nutrition', 'Mental Wellness', 'Sleep Care'
      ];
      for (const catName of defaults) {
        await this.createCategory({ name: catName });
      }
      return this.classRepository.getCategories();
    }
    return categories;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.classRepository.deleteCategory(id);
  }

  // ==========================================
  // WELLNESS CLASSES
  // ==========================================
  async createClass(input: CreateWellnessClassInput): Promise<WellnessClass> {
    const youtubeVideoId = extractYoutubeVideoId(input.videoUrl);
    return this.classRepository.createClass({
      ...input,
      youtubeVideoId,
      isFeatured: input.isFeatured || false,
      isActive: input.isActive !== false,
      tags: input.tags || [],
    });
  }

  async getClasses(filters?: { type?: 'live' | 'recorded'; categoryId?: string; isFeatured?: boolean; isActive?: boolean }): Promise<WellnessClass[]> {
    return this.classRepository.getClasses(filters);
  }

  async getClassById(id: string): Promise<WellnessClass | null> {
    return this.classRepository.getClassById(id);
  }

  async updateClass(id: string, updates: Partial<WellnessClass>): Promise<WellnessClass> {
    const patch: Partial<WellnessClass> = { ...updates };
    if (updates.videoUrl) {
      patch.youtubeVideoId = extractYoutubeVideoId(updates.videoUrl);
    }
    return this.classRepository.updateClass(id, patch);
  }

  async deleteClass(id: string): Promise<boolean> {
    return this.classRepository.deleteClass(id);
  }

  // ==========================================
  // SIMPLIFIED VIDEO PLACEMENTS
  // ==========================================
  async getVideoPlacements(): Promise<VideoPlacement[]> {
    const placements = await this.classRepository.getVideoPlacements();
    const classes = await this.classRepository.getClasses();
    const classMap = new Map<string, WellnessClass>();
    classes.forEach(c => classMap.set(c.id, c));

    return placements.map(placement => {
      if (placement.classId) {
        return {
          ...placement,
          class: classMap.get(placement.classId)
        };
      }
      return placement;
    });
  }

  async updateVideoPlacement(id: string, updates: UpdateVideoPlacementInput): Promise<VideoPlacement> {
    const updated = await this.classRepository.updateVideoPlacement(id, updates);
    if (updated.classId) {
      const cls = await this.classRepository.getClassById(updated.classId);
      return {
        ...updated,
        class: cls || undefined
      };
    }
    return updated;
  }

  // ==========================================
  // ATTENDANCE & ATTENDANCE AUTO-UPDATES
  // ==========================================
  async recordAttendance(input: RecordClassAttendanceInput): Promise<ClassAttendance> {
    const classDetail = await this.classRepository.getClassById(input.classId);
    if (!classDetail) {
      throw new Error('Wellness class not found');
    }

    // Auto-calculate isCompleted if watchDuration reaches a threshold (e.g., 80% of class duration or minimum 10 seconds for test)
    let isCompleted = input.isCompleted || false;
    let completionPercentage = input.completionPercentage || 0;
    
    if (input.watchDuration !== undefined && classDetail.duration > 0) {
      const classDurationSeconds = classDetail.duration * 60;
      completionPercentage = Math.min(Math.round((input.watchDuration / classDurationSeconds) * 100), 100);
      if (completionPercentage >= 80) {
        isCompleted = true;
      }
    }

    return this.classRepository.recordAttendance({
      ...input,
      completionPercentage,
      isCompleted,
    });
  }

  // ==========================================
  // CLASS HISTORY & STREAKS
  // ==========================================
  async getUserHistory(userId: string): Promise<UserClassHistory> {
    const attendanceRecords = await this.classRepository.getAttendanceByUserId(userId);
    const classes = await this.classRepository.getClasses();
    const categories = await this.classRepository.getCategories();
    
    const classMap = new Map<string, WellnessClass>();
    classes.forEach(c => classMap.set(c.id, c));

    const categoryMap = new Map<string, string>();
    categories.forEach(cat => categoryMap.set(cat.id, cat.name));

    // Enrich attendance records with class details
    const attendanceHistory = attendanceRecords.map(rec => {
      const cls = classMap.get(rec.classId);
      return {
        ...rec,
        class: cls,
      };
    });

    // Compute history aggregations
    const totalClassesAttended = attendanceRecords.length;
    const completedWellnessSessions = attendanceRecords.filter(a => a.isCompleted).length;
    const liveSessionsJoined = attendanceRecords.filter(a => {
      const cls = classMap.get(a.classId);
      return cls?.type === 'live';
    }).length;

    // Find last attended class
    let lastAttendedClass: WellnessClass | undefined;
    if (attendanceRecords.length > 0) {
      const sorted = [...attendanceRecords].sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
      lastAttendedClass = classMap.get(sorted[0].classId);
    }

    // Streaks calculation: consecutive days active
    const dates = attendanceRecords.map(a => new Date(a.joinedAt).toDateString());
    const uniqueSortedDates = Array.from(new Set(dates)).map(d => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
    
    let streaks = 0;
    if (uniqueSortedDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastActiveDate = new Date(uniqueSortedDates[0]);
      lastActiveDate.setHours(0, 0, 0, 0);

      const diffTime = today.getTime() - lastActiveDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Active today or yesterday means streak is active
      if (diffDays <= 1) {
        streaks = 1;
        for (let i = 0; i < uniqueSortedDates.length - 1; i++) {
          const d1 = new Date(uniqueSortedDates[i]);
          d1.setHours(0,0,0,0);
          const d2 = new Date(uniqueSortedDates[i + 1]);
          d2.setHours(0,0,0,0);
          
          const diff = d1.getTime() - d2.getTime();
          const days = Math.round(diff / (1000 * 60 * 60 * 24));
          if (days === 1) {
            streaks++;
          } else if (days > 1) {
            break;
          }
        }
      }
    }

    // Category History calculation
    const categoryHistory: Record<string, number> = {};
    attendanceRecords.forEach(rec => {
      const cls = classMap.get(rec.classId);
      if (cls) {
        const catName = categoryMap.get(cls.categoryId) || 'General';
        categoryHistory[catName] = (categoryHistory[catName] || 0) + 1;
      }
    });

    // Wellness progress timeline (Group by date)
    const progressMap = new Map<string, { completedCount: number; totalDuration: number }>();
    attendanceRecords.forEach(rec => {
      const dateStr = new Date(rec.joinedAt).toISOString().split('T')[0];
      const currentVal = progressMap.get(dateStr) || { completedCount: 0, totalDuration: 0 };
      
      if (rec.isCompleted) {
        currentVal.completedCount += 1;
      }
      
      const cls = classMap.get(rec.classId);
      if (cls) {
        // watchDuration is in seconds, convert to minutes
        currentVal.totalDuration += Math.round((rec.watchDuration || 0) / 60);
      }
      progressMap.set(dateStr, currentVal);
    });

    const wellnessProgressTimeline = Array.from(progressMap.entries()).map(([date, val]) => ({
      date,
      completedCount: val.completedCount,
      totalDuration: val.totalDuration,
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalClassesAttended,
      completedWellnessSessions,
      liveSessionsJoined,
      lastAttendedClass,
      attendanceHistory,
      streaks,
      categoryHistory,
      wellnessProgressTimeline,
    };
  }

  // ==========================================
  // ADMIN ANALYTICS DASHBOARD
  // ==========================================
  async getAdminAnalytics(): Promise<any> {
    const allAttendance = await this.classRepository.getAllAttendance();
    const allClasses = await this.classRepository.getClasses();
    
    const classMap = new Map<string, WellnessClass>();
    allClasses.forEach(c => classMap.set(c.id, c));

    const totalAttendanceRecords = allAttendance.length;
    
    // Unique attendees
    const uniqueAttendeesSet = new Set(allAttendance.map(a => a.userId));
    const totalAttendees = uniqueAttendeesSet.size;

    // Active live users (currently in live class or participated in Google Meet live session)
    const activeLiveUsers = allAttendance.filter(a => {
      const cls = classMap.get(a.classId);
      return cls?.type === 'live' && a.interactionJoined;
    }).length;

    // Class completions
    const completedCount = allAttendance.filter(a => a.isCompleted).length;
    const classCompletionRates = totalAttendanceRecords > 0 
      ? Math.round((completedCount / totalAttendanceRecords) * 100) 
      : 0;

    // Google Meet / Interaction participation
    const interactionParticipation = allAttendance.filter(a => a.interactionJoined).length;

    // Dropout rates (joined but watch duration is less than 10% of total class duration)
    let dropouts = 0;
    allAttendance.forEach(a => {
      const cls = classMap.get(a.classId);
      if (cls && cls.duration > 0) {
        const clsDurSec = cls.duration * 60;
        const watchPct = (a.watchDuration / clsDurSec) * 100;
        if (watchPct < 20) {
          dropouts++;
        }
      }
    });
    const dropoutRates = totalAttendanceRecords > 0 
      ? Math.round((dropouts / totalAttendanceRecords) * 100) 
      : 0;

    // Attendance trends (group records by date)
    const trendsMap = new Map<string, number>();
    allAttendance.forEach(a => {
      const dateStr = new Date(a.joinedAt).toISOString().split('T')[0];
      trendsMap.set(dateStr, (trendsMap.get(dateStr) || 0) + 1);
    });
    const attendanceTrends = Array.from(trendsMap.entries()).map(([date, count]) => ({
      date,
      count,
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Most attended classes
    const classCountMap = new Map<string, number>();
    allAttendance.forEach(a => {
      classCountMap.set(a.classId, (classCountMap.get(a.classId) || 0) + 1);
    });
    const mostAttendedClasses = Array.from(classCountMap.entries()).map(([classId, count]) => {
      const cls = classMap.get(classId);
      return {
        classId,
        title: cls?.title || 'Unknown Class',
        type: cls?.type || 'recorded',
        instructor: cls?.instructorName || 'Unknown Instructor',
        count,
      };
    }).sort((a, b) => b.count - a.count).slice(0, 5);

    // Top wellness sessions (sorted by highest completion counts)
    const classCompletionMap = new Map<string, { total: number; completed: number }>();
    allAttendance.forEach(a => {
      const stats = classCompletionMap.get(a.classId) || { total: 0, completed: 0 };
      stats.total += 1;
      if (a.isCompleted) {
        stats.completed += 1;
      }
      classCompletionMap.set(a.classId, stats);
    });

    const topWellnessSessions = Array.from(classCompletionMap.entries()).map(([classId, stats]) => {
      const cls = classMap.get(classId);
      return {
        classId,
        title: cls?.title || 'Unknown Class',
        instructor: cls?.instructorName || 'Unknown Instructor',
        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        totalAttempts: stats.total,
      };
    }).sort((a, b) => b.completionRate - a.completionRate || b.totalAttempts - a.totalAttempts).slice(0, 5);

    return {
      totalAttendees,
      activeLiveUsers,
      classCompletionRates,
      attendanceTrends,
      mostAttendedClasses,
      dropoutRates,
      topWellnessSessions,
      interactionParticipation,
    };
  }
}
