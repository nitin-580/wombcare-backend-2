// Blog Interface
export interface Blog {
  id: string;
  title: string;
  content: string;
  contentType: 'html' | 'json';
  excerpt?: string;
  coverImage?: string;
  authorName: string;
  published: boolean;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateBlogInput = Omit<Blog, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateBlogInput = Partial<CreateBlogInput>;

// Common User Interface
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  weight: number;
  cycleRegularity: string;
  symptoms: string;
  country: string;
  source: string;
  createdAt: string;
  role?: string;
}

export type CreateUserInput = Omit<User, 'id' | 'createdAt'>;

export interface RegistrationStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export interface Career {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  description: string;
  requirements: string[]; // Store as JSON array in DB
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateCareerInput = Omit<Career, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCareerInput = Partial<CreateCareerInput>;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age?: number;
  isActive: boolean;
  lastSeen?: string;
  activePlan?: string;
  planStatus?: string;
  nextAppointment?: string;
  cycleDay?: number;
  cycleLength?: number;
  nextPeriodDate?: string;
  waterIntake: number;
  targetWater: number;
  caloriesTarget: number;
  proteinTarget: number;
  symptoms: string[];
  bmi?: number;
  weight?: number;
  mood?: string;
  moodDate?: string;
  waterIntakeDate?: string;
  isPeriodTrackerEnabled: boolean;
  isPremium: boolean;
  wellnessScore?: number;
  wellnessGoal?: string;
  personalNotes?: string;
  doctorNote?: string;
  profileCompleted: boolean;
  cycleStartDate?: string;
  createdAt: string;
  updatedAt: string;
  sleep: number;
  journal?: string;
}

export interface CreateUserProfileInput {
  name: string;
  email: string;
  age?: number;
  activePlan?: string;
  planStatus?: string;
  waterIntake?: number;
  targetWater?: number;
  caloriesTarget?: number;
  proteinTarget?: number;
  symptoms?: string[];
  bmi?: number;
  weight?: number;
  mood?: string;
  moodDate?: string;
  waterIntakeDate?: string;
  isPeriodTrackerEnabled?: boolean;
  isPremium?: boolean;
  wellnessScore?: number;
  wellnessGoal?: string;
  personalNotes?: string;
  sleep?: number;
  journal?: string;
  doctorNote?: string;
  id?: string;
  profileCompleted?: boolean;
  cycleStartDate?: string;
  cycleDay?: number;
  cycleLength?: number;
  nextPeriodDate?: string;
  nextAppointment?: string;
}
// Doctor Interface
export interface Doctor {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  specialization: string;
  credentials: string;
  referralCode: string;
  profilePicture?: string;
  totalPatients?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorJoinRequest {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  hospitalClinic: string;
  city: string;
  consultationMode: string;
  medicalRegistrationNumber: string;
  agreedToTerms: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export type CreateDoctorJoinRequestInput = Omit<DoctorJoinRequest, 'id' | 'status' | 'createdAt'>;

export type CreateDoctorInput = Omit<
  Doctor,
  "id" | "createdAt" | "updatedAt" | "totalPatients"
>;

export type UpdateDoctorInput = Partial<CreateDoctorInput>;

export interface DoctorLoginInput {
  email: string;
  password: string;
}

export interface DoctorAuthResponse {
  token: string;
  doctor: Omit<Doctor, "password">;
}

// Patient Interface
export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  weight: number;
  cycleRegularity: string;
  symptoms: string;
  country: string;
  referredBy: string; // Doctor ID
  referredId?: string; // Referral ID
  createdAt: string;
  updatedAt: string;
}

export type CreatePatientInput = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePatientInput = Partial<CreatePatientInput>;

// Referral Interface
export interface Referral {
  id: string;
  patientName: string;
  mobile: string;
  email: string;
  problem?: string;
  doctorId: string;
  doctorReferralCode?: string;
  referralStatus: 'pending' | 'contacted' | 'converted' | 'rejected' | 'inactive';
  convertedPatientId?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateReferralInput = Omit<Referral, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateReferralInput = Partial<CreateReferralInput>;

// Enrollment Interface
export interface Enrollment {
  id: string;
  fullName: string;
  age: number;
  phone: string;
  city: string;
  symptoms?: string;
  duration?: string;
  plan: string;
  consultationTime?: string;
  notes?: string;
  createdAt: string;
}

export type CreateEnrollmentInput = Omit<Enrollment, 'id' | 'createdAt'>;

// Banner Interface
export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  targetUrl?: string;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateBannerInput = Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateBannerInput = Partial<CreateBannerInput>;

// Database Adapter Interface
export interface DatabaseAdapter {
  createUser(user: CreateUserInput): Promise<User>;
  getUserByEmail(email: string): Promise<User | null>;
  getRegistrationStats(): Promise<RegistrationStats>;
  getPaginatedUsers(page: number, limit: number): Promise<PaginatedResult<User>>;

  // Blog operations
  createBlog(blog: CreateBlogInput): Promise<Blog>;
  getBlogById(id: string): Promise<Blog | null>;
  getBlogBySlug(slug: string): Promise<Blog | null>;
  getPaginatedBlogs(page: number, limit: number): Promise<PaginatedResult<Blog>>;
  updateBlog(id: string, blog: UpdateBlogInput): Promise<Blog>;
  deleteBlog(id: string): Promise<void>;

  // Career operations
  createCareer(career: CreateCareerInput): Promise<Career>;
  getCareerById(id: string): Promise<Career | null>;
  getPaginatedCareers(page: number, limit: number): Promise<PaginatedResult<Career>>;
  updateCareer(id: string, career: UpdateCareerInput): Promise<Career>;
  deleteCareer(id: string): Promise<void>;

  // Doctor operations
  createDoctor(doctor: CreateDoctorInput): Promise<Doctor>;
  getDoctorById(id: string): Promise<Doctor | null>;
  getDoctorByEmail(email: string): Promise<Doctor | null>;
  getDoctorByReferralCode(code: string): Promise<Doctor | null>;
  getPaginatedDoctors(page: number, limit: number): Promise<PaginatedResult<Doctor>>;
  updateDoctor(id: string, doctor: UpdateDoctorInput): Promise<Doctor>;
  deleteDoctor(id: string): Promise<void>;

  // Patient operations (referred by doctor)
  createPatient(patient: CreatePatientInput): Promise<Patient>;
  getPatientById(id: string): Promise<Patient | null>;
  getPatientsByDoctor(doctorId: string): Promise<Patient[]>;
  getPaginatedPatientsByDoctor(doctorId: string, page: number, limit: number): Promise<PaginatedResult<Patient>>;
  getPaginatedPatients(page: number, limit: number): Promise<PaginatedResult<Patient>>;

  // Referral operations
  createReferral(referral: CreateReferralInput): Promise<Referral>;
  getReferralById(id: string): Promise<Referral | null>;
  getReferralsByDoctor(doctorId: string): Promise<Referral[]>;
  getPaginatedReferrals(options: { 
    page: number; 
    limit: number; 
    status?: string; 
    doctorId?: string; 
    search?: string; 
  }): Promise<PaginatedResult<Referral>>;
  updateReferral(id: string, referral: UpdateReferralInput): Promise<Referral>;

  // Enrollment operations
  createEnrollment(enrollment: CreateEnrollmentInput): Promise<Enrollment>;
  getPaginatedEnrollments(page: number, limit: number): Promise<PaginatedResult<Enrollment>>;
  getEnrollmentStats(): Promise<{ total: number }>;
  
  // User Profile operations
  createUserProfile(profile: CreateUserProfileInput): Promise<UserProfile>;
  getUserProfile(id: string): Promise<UserProfile>;
  updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile>;
  saveUserProfileHistory(history: CreateUserProfileHistoryInput): Promise<UserProfileHistory>;
  getUserProfileHistory(userId: string): Promise<UserProfileHistory[]>;
  savePeriodHistory(history: CreatePeriodHistoryInput): Promise<PeriodHistory>;
  getPeriodHistory(userId: string): Promise<PeriodHistory[]>;
  updatePeriodHistory(id: string, updates: Partial<PeriodHistory>): Promise<PeriodHistory>;

  // Live Chat operations
  createLiveChatMessage(input: CreateLiveChatMessageInput): Promise<LiveChatMessage>;
  getLiveChatMessages(classId: string): Promise<LiveChatMessage[]>;


  // Appointment operations
  createAppointment(appointment: CreateAppointmentInput): Promise<Appointment>;
  getUserAppointments(userId: string): Promise<Appointment[]>;
  getDoctorAppointments(doctorId: string): Promise<Appointment[]>;
  getAllAppointments(): Promise<Appointment[]>;
  updateAppointmentStatus(id: string, status: Appointment['status']): Promise<Appointment>;
  deleteAppointment(id: string): Promise<void>;

  // Earning operations
  getDoctorEarnings(doctorId: string): Promise<DoctorEarning[]>;
  addDoctorEarning(earning: CreateDoctorEarningInput): Promise<DoctorEarning>;

  // Role operations
  getUserRole(email: string): Promise<string | null>;

  // Doctor Join Request operations
  createDoctorJoinRequest(request: CreateDoctorJoinRequestInput): Promise<DoctorJoinRequest>;
  getDoctorJoinRequests(): Promise<DoctorJoinRequest[]>;
  updateDoctorJoinRequestStatus(id: string, status: 'approved' | 'rejected'): Promise<DoctorJoinRequest>;

  // Auth & OTP operations
  saveOtp(email: string, otp: string, expiresAt: Date): Promise<void>;
  verifyOtp(email: string, otp: string): Promise<boolean>;
  updatePassword(email: string, hashedPassword: string): Promise<void>;
  upsertUserRole(email: string, role: string): Promise<void>;

  // Classes Management operations
  createClassCategory(category: CreateClassCategoryInput): Promise<ClassCategory>;
  getClassCategories(): Promise<ClassCategory[]>;
  deleteClassCategory(id: string): Promise<boolean>;

  createWellnessClass(cls: CreateWellnessClassInput): Promise<WellnessClass>;
  getWellnessClasses(filters?: { type?: 'live' | 'recorded'; categoryId?: string; isFeatured?: boolean; isActive?: boolean }): Promise<WellnessClass[]>;
  getWellnessClassById(id: string): Promise<WellnessClass | null>;
  updateWellnessClass(id: string, updates: Partial<WellnessClass>): Promise<WellnessClass>;
  deleteWellnessClass(id: string): Promise<boolean>;

  getVideoPlacements(): Promise<VideoPlacement[]>;
  updateVideoPlacement(id: string, updates: UpdateVideoPlacementInput): Promise<VideoPlacement>;

  recordClassAttendance(attendance: RecordClassAttendanceInput): Promise<ClassAttendance>;
  getClassAttendance(userId: string): Promise<ClassAttendance[]>;
  getAllClassAttendance(): Promise<ClassAttendance[]>;

  // Banner operations
  createBanner(banner: CreateBannerInput): Promise<Banner>;
  getBannerById(id: string): Promise<Banner | null>;
  getPaginatedBanners(page: number, limit: number): Promise<PaginatedResult<Banner>>;
  getActiveBanners(): Promise<Banner[]>;
  updateBanner(id: string, banner: UpdateBannerInput): Promise<Banner>;
  deleteBanner(id: string): Promise<void>;

  // Nutrition & Diet operations
  createFood(food: Omit<Food, 'id' | 'createdAt'>): Promise<Food>;
  searchFoods(query: string): Promise<Food[]>;
  createDietPlan(plan: Omit<DietPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<DietPlan>;
  getDietPlanByUserId(userId: string): Promise<DietPlan | null>;
  getDietPlanById(id: string): Promise<DietPlan | null>;
  getPaginatedDietPlans(page: number, limit: number): Promise<PaginatedResult<DietPlan>>;
  updateDietPlan(id: string, updates: Partial<DietPlan>): Promise<DietPlan>;
  deleteDietPlan(id: string): Promise<void>;
  trackMeal(log: Omit<MealLog, 'id' | 'createdAt'>): Promise<MealLog>;
  getMealLogs(userId: string, startDate: string, endDate: string): Promise<MealLog[]>;
  getMealLogsByDate(userId: string, date: string): Promise<MealLog[]>;
  deleteMealLog(userId: string, date: string, day: number, mealIndex: number): Promise<void>;
}


export interface Appointment {
  id: string;
  userId: string;
  doctorId?: string;
  doctorName: string;
  patientName?: string;
  patientEmail?: string;
  appointmentDate: string; // ISO string
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'incomplete' | 'scheduled' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentInput {
  userId: string;
  doctorId?: string;
  doctorName: string;
  patientName?: string;
  patientEmail?: string;
  appointmentDate: string;
  status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'incomplete' | 'scheduled' | 'cancelled';
  notes?: string;
}

export interface DoctorEarning {
  id: string;
  doctorId: string;
  appointmentId?: string;
  amount: number;
  status: 'pending' | 'processed' | 'withdrawn' | 'transferred';
  description?: string;
  date: string;
  createdAt: string;
}

export interface CreateDoctorEarningInput {
  doctorId: string;
  appointmentId?: string;
  amount: number;
  status: 'pending' | 'processed' | 'transferred';
  description?: string;
  date: string;
}

export interface UserProfileHistory {
  id: string;
  userId: string;
  date: string;
  waterIntake: number;
  mood?: string;
  sleep: number;
  cycleDay?: number;
  symptoms: string[];
  createdAt: string;
  journal?: string;
}

export interface CreateUserProfileHistoryInput {
  userId: string;
  date: string;
  waterIntake: number;
  mood?: string;
  sleep?: number;
  cycleDay?: number;
  symptoms?: string[];
  journal?: string;
}

export interface PeriodHistory {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  symptoms: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePeriodHistoryInput {
  userId: string;
  startDate: string;
  endDate: string;
  symptoms?: string[];
  notes?: string;
}

export interface ClassCategory {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface CreateClassCategoryInput {
  name: string;
  slug: string;
}

export interface WellnessClass {
  id: string;
  title: string;
  description: string;
  type: 'live' | 'recorded';
  thumbnailUrl: string;
  videoUrl: string;
  youtubeVideoId: string;
  googleMeetLink?: string;
  scheduledAt?: string;
  instructorName: string;
  instructorId?: string;
  duration: number; // in minutes
  categoryId: string;
  isFeatured: boolean;
  isActive: boolean;
  tags: string[];
  jitsiSessionStatus?: string;
  jitsiRecordingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWellnessClassInput {
  title: string;
  description: string;
  type: 'live' | 'recorded';
  thumbnailUrl: string;
  videoUrl: string;
  youtubeVideoId: string;
  googleMeetLink?: string;
  scheduledAt?: string;
  instructorName: string;
  instructorId?: string;
  duration: number;
  categoryId: string;
  isFeatured?: boolean;
  isActive?: boolean;
  tags?: string[];
  jitsiSessionStatus?: string;
  jitsiRecordingUrl?: string;
}

export interface VideoPlacement {
  id: string;
  label: 'Link 1' | 'Link 2' | 'Link 3' | 'Link 4';
  description: string;
  classId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  class?: WellnessClass;
}

export interface UpdateVideoPlacementInput {
  classId?: string;
  isActive?: boolean;
}

export interface ClassAttendance {
  id: string;
  userId: string;
  classId: string;
  joinedAt: string;
  leftAt?: string;
  watchDuration: number; // in seconds
  completionPercentage: number; // 0 to 100
  isCompleted: boolean;
  interactionJoined: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecordClassAttendanceInput {
  userId: string;
  classId: string;
  joinedAt?: string;
  leftAt?: string;
  watchDuration?: number;
  completionPercentage?: number;
  isCompleted?: boolean;
  interactionJoined?: boolean;
}

export interface UserClassHistory {
  totalClassesAttended: number;
  completedWellnessSessions: number;
  liveSessionsJoined: number;
  lastAttendedClass?: WellnessClass;
  attendanceHistory: Array<ClassAttendance & { class?: WellnessClass }>;
  streaks: number;
  categoryHistory: Record<string, number>;
  wellnessProgressTimeline: Array<{
    date: string;
    completedCount: number;
    totalDuration: number;
  }>;
}

// Live Chat Interfaces
export interface LiveChatMessage {
  id: string;
  classId: string;
  userId: string;
  senderName: string;
  senderRole: 'user' | 'doctor' | 'admin';
  message: string;
  createdAt: string;
}

export interface CreateLiveChatMessageInput {
  classId: string;
  userId: string;
  senderName: string;
  senderRole: 'user' | 'doctor' | 'admin';
  message: string;
}

// Nutrition & Diet Management Interfaces
export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  category: string;
  createdAt?: string;
}

export interface DayDietPlan {
  day: number; // 1 to 7
  meals: Array<{
    name: string; // e.g. 'Breakfast', 'Snack'
    time: string; // e.g. '08:30 AM'
    foodItems: Array<{
      name: string;
      quantity: string;
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    }>;
    instructions?: string;
  }>;
}

export interface DietPlan {
  id: string;
  userId: string;
  userIds?: string[];
  name: string;
  description?: string;
  patientAge?: string;
  patientHeight?: string;
  patientWeight?: string;
  patientGoal?: string;
  patientDiet?: string;
  dietData: DayDietPlan[];
  foodsToAvoid: string[];
  dailyTargets: Array<{ name: string; target: string }>;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealLog {
  id: string;
  userId: string;
  dietPlanId: string;
  date: string; // YYYY-MM-DD
  day: number; // 1 to 7
  mealIndex: number; // index of meal in DayDietPlan.meals
  mealName: string;
  status: 'completed' | 'delayed' | 'skipped';
  completionTime?: string;
  dailyCompletionPercentage: number;
  createdAt: string;
}

export interface WeeklyNutritionReport {
  totalMealsCompleted: number;
  mealsEatenOnTime: number;
  skippedMeals: number;
  consistencyPercentage: number;
  overallDietAdherence: number;
}



