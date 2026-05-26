import { 
  DatabaseAdapter, 
  ClassCategory, 
  CreateClassCategoryInput, 
  WellnessClass, 
  CreateWellnessClassInput, 
  VideoPlacement, 
  UpdateVideoPlacementInput, 
  ClassAttendance, 
  RecordClassAttendanceInput 
} from '../database/interfaces';

export class ClassRepository {
  constructor(private dbAdapter: DatabaseAdapter) {}

  // Category Operations
  async createCategory(category: CreateClassCategoryInput): Promise<ClassCategory> {
    return this.dbAdapter.createClassCategory(category);
  }

  async getCategories(): Promise<ClassCategory[]> {
    return this.dbAdapter.getClassCategories();
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.dbAdapter.deleteClassCategory(id);
  }

  // Wellness Class Operations
  async createClass(cls: CreateWellnessClassInput): Promise<WellnessClass> {
    return this.dbAdapter.createWellnessClass(cls);
  }

  async getClasses(filters?: { type?: 'live' | 'recorded'; categoryId?: string; isFeatured?: boolean; isActive?: boolean }): Promise<WellnessClass[]> {
    return this.dbAdapter.getWellnessClasses(filters);
  }

  async getClassById(id: string): Promise<WellnessClass | null> {
    return this.dbAdapter.getWellnessClassById(id);
  }

  async updateClass(id: string, updates: Partial<WellnessClass>): Promise<WellnessClass> {
    return this.dbAdapter.updateWellnessClass(id, updates);
  }

  async deleteClass(id: string): Promise<boolean> {
    return this.dbAdapter.deleteWellnessClass(id);
  }

  // Video Placement Operations
  async getVideoPlacements(): Promise<VideoPlacement[]> {
    return this.dbAdapter.getVideoPlacements();
  }

  async updateVideoPlacement(id: string, updates: UpdateVideoPlacementInput): Promise<VideoPlacement> {
    return this.dbAdapter.updateVideoPlacement(id, updates);
  }

  // Attendance Operations
  async recordAttendance(attendance: RecordClassAttendanceInput): Promise<ClassAttendance> {
    return this.dbAdapter.recordClassAttendance(attendance);
  }

  async getAttendanceByUserId(userId: string): Promise<ClassAttendance[]> {
    return this.dbAdapter.getClassAttendance(userId);
  }

  async getAllAttendance(): Promise<ClassAttendance[]> {
    return this.dbAdapter.getAllClassAttendance();
  }
}
