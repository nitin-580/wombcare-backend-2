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
  doctorNote?: string;
  id?: string;
  profileCompleted?: boolean;
  cycleStartDate?: string;
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
  createdAt: string;
  updatedAt: string;
}

export type CreatePatientInput = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePatientInput = Partial<CreatePatientInput>;

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

  // Enrollment operations
  createEnrollment(enrollment: CreateEnrollmentInput): Promise<Enrollment>;
  getPaginatedEnrollments(page: number, limit: number): Promise<PaginatedResult<Enrollment>>;
  getEnrollmentStats(): Promise<{ total: number }>;
  
  // User Profile operations
  createUserProfile(profile: CreateUserProfileInput): Promise<UserProfile>;
  getUserProfile(id: string): Promise<UserProfile>;
  updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile>;

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
  status: 'pending' | 'processed' | 'withdrawn';
  description?: string;
  date: string;
  createdAt: string;
}

export interface CreateDoctorEarningInput {
  doctorId: string;
  appointmentId?: string;
  amount: number;
  status: 'pending' | 'processed';
  description?: string;
  date: string;
}
