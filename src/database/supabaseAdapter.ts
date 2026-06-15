import ws from 'ws';

(global as any).WebSocket = ws;
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  DatabaseAdapter,
  User,
  CreateUserInput,
  RegistrationStats,
  PaginatedResult,
  Blog,
  CreateBlogInput,
  UpdateBlogInput,
  Career,
  CreateCareerInput,
  UpdateCareerInput,
  Doctor,
  CreateDoctorInput,
  UpdateDoctorInput,
  Patient,
  CreatePatientInput,
  UpdatePatientInput,
  Enrollment,
  CreateEnrollmentInput,
  UserProfile,
  CreateUserProfileInput,
  Appointment,
  CreateAppointmentInput,
  DoctorJoinRequest,
  CreateDoctorJoinRequestInput,
  DoctorEarning,
  CreateDoctorEarningInput,
  UserProfileHistory,
  CreateUserProfileHistoryInput,
  ClassCategory,
  CreateClassCategoryInput,
  WellnessClass,
  CreateWellnessClassInput,
  VideoPlacement,
  UpdateVideoPlacementInput,
  ClassAttendance,
  RecordClassAttendanceInput,
  PeriodHistory,
  CreatePeriodHistoryInput,
  Referral,
  CreateReferralInput,
  UpdateReferralInput,
  LiveChatMessage,
  CreateLiveChatMessageInput,
  Banner,
  CreateBannerInput,
  UpdateBannerInput,
  Food,
  DietPlan,
  DayDietPlan,
  MealLog,
  WeeklyNutritionReport
} from './interfaces';

import { env } from '../config/env';

export class SupabaseAdapter implements DatabaseAdapter {
  private supabase: SupabaseClient;
  private readonly tableName = 'early_access_users';
  private readonly blogsTableName = 'blogs';
  private readonly doctorsTableName = 'users';
  private readonly patientsTableName = 'wombcare_patients';
  private readonly enrollmentsTableName = 'wombcare_enrollment_forms';
  private readonly userProfilesTableName = 'wombcare_user_profiles';
  private readonly appointmentsTableName = 'wombcare_appointments';
  private readonly userRolesTableName = 'user_roles';
  private readonly doctorJoinRequestsTableName = 'doctor_join_requests';
  private readonly otpTableName = 'password_reset_otps';
  private readonly doctorEarningsTableName = 'wombcare_doctor_earnings';
  private readonly userProfileHistoryTableName = 'wombcare_user_profile_history';
  private readonly periodHistoryTableName = 'wombcare_period_history';
  private readonly classCategoriesTableName = 'wombcare_classes_categories';
  private readonly classesTableName = 'wombcare_classes';
  private readonly videoPlacementsTableName = 'wombcare_video_placements';
  private readonly classAttendanceTableName = 'wombcare_class_attendance';
  private readonly liveChatsTableName = 'wombcare_live_chats';
  private readonly bannersTableName = 'wombcare_banners';
  private readonly foodsTableName = 'wombcare_foods';
  private readonly dietPlansTableName = 'wombcare_diet_plans';
  private readonly mealLogsTableName = 'wombcare_meal_logs';


  constructor() {
    this.supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }

  // Map database row to Domain User object
  private mapToUser(row: any): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone || '',
      age: row.age || 0,
      weight: row.weight || 0,
      cycleRegularity: row.cycle_regular || '',
      symptoms: row.symptoms || '',
      country: row.country || '',
      source: row.source || '',
      createdAt: row.created_at,
    };
  }

  // Map Domain User to Database row object
  private mapToDbRow(user: CreateUserInput) {
    return {
      name: user.name,
      email: user.email,
      phone: user.phone,
      age: user.age,
      weight: user.weight,
      cycle_regular: user.cycleRegularity,
      symptoms: user.symptoms,
      country: user.country,
      source: user.source,
    };
  }

  // Map database row to Domain Blog object
  private mapToBlog(row: any): Blog {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      contentType: row.content_type,
      excerpt: row.excerpt,
      coverImage: row.cover_image,
      authorName: row.author_name,
      published: row.published,
      slug: row.slug,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // Map Domain Blog input to Database row object
  private mapToBlogDbRow(blog: CreateBlogInput | UpdateBlogInput) {
    const row: any = {};
    if (blog.title) row.title = blog.title;
    if (blog.content) row.content = blog.content;
    if (blog.contentType) row.content_type = blog.contentType;
    if (blog.excerpt !== undefined) row.excerpt = blog.excerpt;
    if (blog.coverImage !== undefined) row.cover_image = blog.coverImage;
    if (blog.authorName) row.author_name = blog.authorName;
    if (blog.published !== undefined) row.published = blog.published;
    if (blog.slug) row.slug = blog.slug;
    return row;
  }

  async createUser(user: CreateUserInput): Promise<User> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(this.mapToDbRow(user))
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return this.mapToUser(data);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is multiple (or no) rows returned
      throw new Error(`Failed to fetch user by email: ${error.message}`);
    }

    return data ? this.mapToUser(data) : null;
  }

  async getRegistrationStats(): Promise<RegistrationStats> {
    const now = new Date();

    // Setting up date boundaries
    const startOfToday = new Date(now.setHours(0, 0, 0, 0)).toISOString();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start 
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // To prevent multiple roundtrips, usually handled by custom SQL, but we'll do separate counts in Supabase for simplicity
    const [totalResp, todayResp, weekResp, monthResp] = await Promise.all([
      this.supabase.from(this.tableName).select('*', { count: 'exact', head: true }),
      this.supabase.from(this.tableName).select('*', { count: 'exact', head: true }).gte('created_at', startOfToday),
      this.supabase.from(this.tableName).select('*', { count: 'exact', head: true }).gte('created_at', startOfWeek.toISOString()),
      this.supabase.from(this.tableName).select('*', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    ]);

    return {
      total: totalResp.count || 0,
      today: todayResp.count || 0,
      thisWeek: weekResp.count || 0,
      thisMonth: monthResp.count || 0,
    };
  }

  async getPaginatedUsers(page: number, limit: number): Promise<PaginatedResult<User>> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 1. Get emails of users with 'user' role from user_roles
    const { data: roleData, error: roleError } = await this.supabase
      .from(this.userRolesTableName)
      .select('email')
      .eq('role', 'user');

    if (roleError) {
      throw new Error(`Failed to fetch user roles: ${roleError.message}`);
    }

    const emails = (roleData || []).map(r => r.email);
    if (emails.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        limit,
      };
    }

    // 2. Fetch paginated users from users table matching those emails
    const { data, error, count } = await this.supabase
      .from(this.doctorsTableName)
      .select('*', { count: 'exact' })
      .in('email', emails)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch paginated users: ${error.message}`);
    }

    const users = (data || []).map(row => {
      const u = this.mapToUser(row);
      return { ...u, role: 'user' };
    });

    return {
      data: users,
      total: count || 0,
      page,
      limit,
    };
  }

  // Blog operations implementation
  async createBlog(blog: CreateBlogInput): Promise<Blog> {
    const { data, error } = await this.supabase
      .from(this.blogsTableName)
      .insert(this.mapToBlogDbRow(blog))
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create blog: ${error.message}`);
    }

    return this.mapToBlog(data);
  }

  async getBlogById(id: string): Promise<Blog | null> {
    const { data, error } = await this.supabase
      .from(this.blogsTableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch blog by id: ${error.message}`);
    }

    return data ? this.mapToBlog(data) : null;
  }

  async getBlogBySlug(slug: string): Promise<Blog | null> {
    const { data, error } = await this.supabase
      .from(this.blogsTableName)
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch blog by slug: ${error.message}`);
    }

    return data ? this.mapToBlog(data) : null;
  }

  async getPaginatedBlogs(page: number, limit: number): Promise<PaginatedResult<Blog>> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await this.supabase
      .from(this.blogsTableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch paginated blogs: ${error.message}`);
    }

    return {
      data: data.map(this.mapToBlog),
      total: count || 0,
      page,
      limit,
    };
  }

  async updateBlog(id: string, blog: UpdateBlogInput): Promise<Blog> {
    const { data, error } = await this.supabase
      .from(this.blogsTableName)
      .update(this.mapToBlogDbRow(blog))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update blog: ${error.message}`);
    }

    return this.mapToBlog(data);
  }

  async deleteBlog(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.blogsTableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete blog: ${error.message}`);
    }
  }

  // Career operations implementation
  private mapToCareer(row: any): Career {
    return {
      id: row.id,
      title: row.title,
      department: row.department,
      location: row.location,
      type: row.type,
      description: row.description,
      requirements: row.requirements || [],
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToCareerDbRow(career: CreateCareerInput | UpdateCareerInput) {
    const row: any = {};
    if (career.title) row.title = career.title;
    if (career.department) row.department = career.department;
    if (career.location) row.location = career.location;
    if (career.type) row.type = career.type;
    if (career.description) row.description = career.description;
    if (career.requirements) row.requirements = career.requirements;
    if (career.active !== undefined) row.active = career.active;
    return row;
  }

  async createCareer(career: CreateCareerInput): Promise<Career> {
    const { data, error } = await this.supabase
      .from('careers')
      .insert(this.mapToCareerDbRow(career))
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create career: ${error.message}`);
    }

    return this.mapToCareer(data);
  }

  async getCareerById(id: string): Promise<Career | null> {
    const { data, error } = await this.supabase
      .from('careers')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch career by id: ${error.message}`);
    }

    return data ? this.mapToCareer(data) : null;
  }

  async getPaginatedCareers(page: number, limit: number): Promise<PaginatedResult<Career>> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await this.supabase
      .from('careers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch paginated careers: ${error.message}`);
    }

    return {
      data: data.map(this.mapToCareer),
      total: count || 0,
      page,
      limit,
    };
  }

  async updateCareer(id: string, career: UpdateCareerInput): Promise<Career> {
    const { data, error } = await this.supabase
      .from('careers')
      .update(this.mapToCareerDbRow(career))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update career: ${error.message}`);
    }

    return this.mapToCareer(data);
  }

  async deleteCareer(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('careers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete career: ${error.message}`);
    }
  }
  private mapToDoctor(row: any): Doctor {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      password: row.password,
      phone: row.phone,
      specialization: row.specialization,
      credentials: row.credentials,
      referralCode: row.referral_code,
      profilePicture: row.profile_picture,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToDoctorDbRow(doctor: CreateDoctorInput | UpdateDoctorInput) {
    const row: any = {};
    if (doctor.name) row.name = doctor.name;
    if (doctor.email) row.email = doctor.email;
    if (doctor.password) row.password = doctor.password;
    if (doctor.phone) row.phone = doctor.phone;
    if (doctor.specialization) row.specialization = doctor.specialization;
    if (doctor.credentials) row.credentials = doctor.credentials;
    if (doctor.referralCode) row.referral_code = doctor.referralCode;
    if (doctor.profilePicture !== undefined) row.profile_picture = doctor.profilePicture;
    return row;
  }

  async createDoctor(doctor: CreateDoctorInput): Promise<Doctor> {
    const { data, error } = await this.supabase
      .from(this.doctorsTableName)
      .insert(this.mapToDoctorDbRow(doctor))
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create doctor: ${error.message}`);
    }

    return this.mapToDoctor(data);
  }

  async getDoctorById(id: string): Promise<Doctor | null> {
    const { data, error } = await this.supabase
      .from(this.doctorsTableName)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch doctor: ${error.message}`);
    }

    return data ? this.mapToDoctor(data) : null;
  }

  async getDoctorByEmail(email: string): Promise<Doctor | null> {
    const { data, error } = await this.supabase
      .from(this.doctorsTableName)
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch doctor by email: ${error.message}`);
    }

    return data ? this.mapToDoctor(data) : null;
  }

  async getDoctorByReferralCode(code: string): Promise<Doctor | null> {
    const { data, error } = await this.supabase
      .from(this.doctorsTableName)
      .select("*")
      .eq("referral_code", code)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch doctor by referral code: ${error.message}`);
    }

    return data ? this.mapToDoctor(data) : null;
  }

  async getPaginatedDoctors(page: number, limit: number): Promise<PaginatedResult<Doctor>> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 1. Get emails of users with 'doctor' role
    const { data: roleData, error: roleError } = await this.supabase
      .from(this.userRolesTableName)
      .select('email')
      .eq('role', 'doctor');

    if (roleError) {
      throw new Error(`Failed to fetch doctor roles: ${roleError.message}`);
    }

    const emails = (roleData || []).map(r => r.email);
    if (emails.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        limit,
      };
    }

    // 2. Fetch paginated users who have those emails
    const { data, error, count } = await this.supabase
      .from(this.doctorsTableName)
      .select('*', { count: 'exact' })
      .in('email', emails)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch paginated doctors: ${error.message}`);
    }

    return {
      data: data.map(this.mapToDoctor),
      total: count || 0,
      page,
      limit,
    };
  }

  async updateDoctor(id: string, doctor: UpdateDoctorInput): Promise<Doctor> {
    const { data, error } = await this.supabase
      .from(this.doctorsTableName)
      .update(this.mapToDoctorDbRow(doctor))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update doctor: ${error.message}`);
    }

    return this.mapToDoctor(data);
  }

  async deleteDoctor(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.doctorsTableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete doctor: ${error.message}`);
    }
  }

  // Patient operations mapping
  private mapToPatient(row: any): Patient {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      age: row.age,
      weight: row.weight,
      cycleRegularity: row.cycle_regular,
      symptoms: row.symptoms,
      country: row.country,
      referredBy: row.referred_by,
      referredId: row.referred_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToPatientDbRow(patient: CreatePatientInput | UpdatePatientInput) {
    const row: any = {};
    if (patient.name) row.name = patient.name;
    if (patient.email) row.email = patient.email;
    if (patient.phone) row.phone = patient.phone;
    if (patient.age) row.age = patient.age;
    if (patient.weight) row.weight = patient.weight;
    if (patient.cycleRegularity) row.cycle_regular = patient.cycleRegularity;
    if (patient.symptoms) row.symptoms = patient.symptoms;
    if (patient.country) row.country = patient.country;
    if (patient.referredBy) row.referred_by = patient.referredBy;
    if (patient.referredId) row.referred_id = patient.referredId;
    return row;
  }

  async createPatient(patient: CreatePatientInput): Promise<Patient> {
    const { data, error } = await this.supabase
      .from("patients")
      .insert(this.mapToPatientDbRow(patient))
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create patient: ${error.message}`);
    }

    return this.mapToPatient(data);
  }

  async getPatientById(id: string): Promise<Patient | null> {
    const { data, error } = await this.supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch patient: ${error.message}`);
    }

    return data ? this.mapToPatient(data) : null;
  }

  async getPatientsByDoctor(doctorId: string): Promise<Patient[]> {
    const { data, error } = await this.supabase
      .from("patients")
      .select("*")
      .eq("referred_by", doctorId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch patients for doctor: ${error.message}`);
    }

    return data.map(this.mapToPatient);
  }

  async getPaginatedPatientsByDoctor(doctorId: string, page: number, limit: number): Promise<PaginatedResult<Patient>> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await this.supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .eq("referred_by", doctorId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch paginated patients for doctor: ${error.message}`);
    }

    return {
      data: data.map(this.mapToPatient),
      total: count || 0,
      page,
      limit,
    };
  }

  async getPaginatedPatients(page: number, limit: number): Promise<PaginatedResult<Patient>> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await this.supabase
      .from('patients')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch paginated patients: ${error.message}`);
    }

    return {
      data: data.map(this.mapToPatient),
      total: count || 0,
      page,
      limit,
    };
  }

  // Referral operations mapping
  private mapToReferral(row: any): Referral {
    return {
      id: row.id,
      patientName: row.patient_name,
      mobile: row.mobile,
      email: row.email,
      problem: row.problem,
      doctorId: row.doctor_id,
      doctorReferralCode: row.doctor_referral_code,
      referralStatus: row.referral_status,
      convertedPatientId: row.converted_patient_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToReferralDbRow(referral: CreateReferralInput | UpdateReferralInput) {
    const row: any = {};
    if (referral.patientName) row.patient_name = referral.patientName;
    if (referral.mobile) row.mobile = referral.mobile;
    if (referral.email !== undefined) row.email = referral.email;
    if (referral.problem !== undefined) row.problem = referral.problem;
    if (referral.doctorId) row.doctor_id = referral.doctorId;
    if (referral.doctorReferralCode !== undefined) row.doctor_referral_code = referral.doctorReferralCode;
    if (referral.referralStatus) row.referral_status = referral.referralStatus;
    if (referral.convertedPatientId !== undefined) row.converted_patient_id = referral.convertedPatientId;
    return row;
  }

  async createReferral(referral: CreateReferralInput): Promise<Referral> {
    const { data, error } = await this.supabase
      .from("referrals")
      .insert(this.mapToReferralDbRow(referral))
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create referral: ${error.message}`);
    }

    return this.mapToReferral(data);
  }

  async getReferralById(id: string): Promise<Referral | null> {
    const { data, error } = await this.supabase
      .from("referrals")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch referral: ${error.message}`);
    }

    return data ? this.mapToReferral(data) : null;
  }

  async getReferralsByDoctor(doctorId: string): Promise<Referral[]> {
    const { data, error } = await this.supabase
      .from("referrals")
      .select("*")
      .eq("doctor_id", doctorId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch referrals: ${error.message}`);
    }

    return data.map(this.mapToReferral);
  }

  async getPaginatedReferrals(options: { 
    page: number; 
    limit: number; 
    status?: string; 
    doctorId?: string; 
    search?: string; 
  }): Promise<PaginatedResult<Referral>> {
    const from = (options.page - 1) * options.limit;
    const to = from + options.limit - 1;

    let query = this.supabase
      .from("referrals")
      .select("*", { count: 'exact' });

    if (options.status) {
      query = query.eq("referral_status", options.status);
    }
    if (options.doctorId) {
      query = query.eq("doctor_id", options.doctorId);
    }
    if (options.search) {
      query = query.ilike("patient_name", `%${options.search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch paginated referrals: ${error.message}`);
    }

    return {
      data: data.map(this.mapToReferral),
      total: count || 0,
      page: options.page,
      limit: options.limit,
    };
  }

  async updateReferral(id: string, referral: UpdateReferralInput): Promise<Referral> {
    const updates = this.mapToReferralDbRow(referral);
    updates.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from("referrals")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update referral: ${error.message}`);
    }

    return this.mapToReferral(data);
  }

  // Enrollment operations
  private mapToEnrollment(row: any): Enrollment {
    return {
      id: row.id,
      fullName: row.full_name,
      age: row.age,
      phone: row.phone,
      city: row.city,
      symptoms: row.symptoms,
      duration: row.condition_duration,
      plan: row.preferred_plan,
      consultationTime: row.preferred_consultation_time,
      notes: row.additional_notes,
      createdAt: row.created_at,
    };
  }

  private mapToEnrollmentDbRow(enrollment: CreateEnrollmentInput) {
    return {
      full_name: enrollment.fullName,
      age: enrollment.age,
      phone: enrollment.phone,
      city: enrollment.city,
      symptoms: enrollment.symptoms,
      condition_duration: enrollment.duration,
      preferred_plan: enrollment.plan,
      preferred_consultation_time: enrollment.consultationTime,
      additional_notes: enrollment.notes,
    };
  }

  async createEnrollment(enrollment: CreateEnrollmentInput): Promise<Enrollment> {
    const { data, error } = await this.supabase
      .from(this.enrollmentsTableName)
      .insert(this.mapToEnrollmentDbRow(enrollment))
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create enrollment: ${error.message}`);
    }

    return this.mapToEnrollment(data);
  }

  async getPaginatedEnrollments(page: number, limit: number): Promise<PaginatedResult<Enrollment>> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    console.log(`[DEBUG] Fetching enrollments from table: ${this.enrollmentsTableName}`);
    const { data, error, count } = await this.supabase
      .from(this.enrollmentsTableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[DEBUG] Supabase error:', error);
      throw new Error(`Failed to fetch paginated enrollments: ${error.message}`);
    }
    console.log(`[DEBUG] Found ${data?.length || 0} enrollments`);

    return {
      data: data.map(this.mapToEnrollment),
      total: count || 0,
      page,
      limit,
    };
  }

  async getEnrollmentStats(): Promise<{ total: number }> {
    const { count, error } = await this.supabase
      .from(this.enrollmentsTableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Failed to fetch enrollment stats: ${error.message}`);
    }

    return { total: count || 0 };
  }

  // User Profile methods
  async createUserProfile(profile: CreateUserProfileInput): Promise<UserProfile> {
    const { data, error } = await this.supabase
      .from(this.userProfilesTableName)
      .insert({
        name: profile.name,
        email: profile.email,
        age: profile.age,
        active_plan: profile.activePlan,
        plan_status: profile.planStatus,
        water_intake: profile.waterIntake,
        target_water: profile.targetWater,
        calories_target: profile.caloriesTarget,
        protein_target: profile.proteinTarget,
        symptoms: profile.symptoms,
        bmi: profile.bmi,
        wellness_score: profile.wellnessScore,
        wellness_goal: profile.wellnessGoal,
        personal_notes: profile.personalNotes,
        doctor_note: profile.doctorNote,
        id: profile.id,
        profile_completed: profile.profileCompleted ?? true,
        cycle_start_date: profile.cycleStartDate,
        weight: profile.weight,
        mood: profile.mood,
        mood_date: profile.moodDate,
        water_intake_date: profile.waterIntakeDate,
        is_period_tracker_enabled: profile.isPeriodTrackerEnabled ?? true,
        is_premium: profile.isPremium ?? false,
        cycle_day: profile.cycleDay,
        cycle_length: profile.cycleLength,
        next_period_date: profile.nextPeriodDate,
        next_appointment: profile.nextAppointment,
        sleep: profile.sleep ?? 0,
        journal: profile.journal
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user profile: ${error.message}`);
    }

    return this.mapToUserProfile(data);
  }

  async getUserProfile(id: string): Promise<UserProfile> {
    const { data, error } = await this.supabase
      .from(this.userProfilesTableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    return this.mapToUserProfile(data);
  }

  async updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.age !== undefined) dbUpdates.age = updates.age;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.lastSeen !== undefined) dbUpdates.last_seen = updates.lastSeen;
    if (updates.activePlan !== undefined) dbUpdates.active_plan = updates.activePlan;
    if (updates.planStatus !== undefined) dbUpdates.plan_status = updates.planStatus;
    if (updates.nextAppointment !== undefined) dbUpdates.next_appointment = updates.nextAppointment;
    if (updates.cycleDay !== undefined) dbUpdates.cycle_day = updates.cycleDay;
    if (updates.cycleLength !== undefined) dbUpdates.cycle_length = updates.cycleLength;
    if (updates.nextPeriodDate !== undefined) dbUpdates.next_period_date = updates.nextPeriodDate;
    if (updates.waterIntake !== undefined) dbUpdates.water_intake = updates.waterIntake;
    if (updates.targetWater !== undefined) dbUpdates.target_water = updates.targetWater;
    if (updates.caloriesTarget !== undefined) dbUpdates.calories_target = updates.caloriesTarget;
    if (updates.proteinTarget !== undefined) dbUpdates.protein_target = updates.proteinTarget;
    if (updates.symptoms !== undefined) dbUpdates.symptoms = updates.symptoms;
    if (updates.bmi !== undefined) dbUpdates.bmi = updates.bmi;
    if (updates.wellnessScore !== undefined) dbUpdates.wellness_score = updates.wellnessScore;
    if (updates.personalNotes !== undefined) dbUpdates.personal_notes = updates.personalNotes;
    if (updates.doctorNote !== undefined) dbUpdates.doctor_note = updates.doctorNote;
    if (updates.wellnessGoal !== undefined) dbUpdates.wellness_goal = updates.wellnessGoal;
    if (updates.profileCompleted !== undefined) dbUpdates.profile_completed = updates.profileCompleted;
    if (updates.cycleStartDate !== undefined) dbUpdates.cycle_start_date = updates.cycleStartDate;
    if (updates.weight !== undefined) dbUpdates.weight = updates.weight;
    if (updates.mood !== undefined) dbUpdates.mood = updates.mood;
    if (updates.moodDate !== undefined) dbUpdates.mood_date = updates.moodDate;
    if (updates.waterIntakeDate !== undefined) dbUpdates.water_intake_date = updates.waterIntakeDate;
    if (updates.isPeriodTrackerEnabled !== undefined) dbUpdates.is_period_tracker_enabled = updates.isPeriodTrackerEnabled;
    if (updates.isPremium !== undefined) dbUpdates.is_premium = updates.isPremium;
    if (updates.sleep !== undefined) dbUpdates.sleep = updates.sleep;
    if (updates.journal !== undefined) dbUpdates.journal = updates.journal;

    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from(this.userProfilesTableName)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }

    return this.mapToUserProfile(data);
  }

  private mapToUserProfile(row: any): UserProfile {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      age: row.age,
      isActive: row.is_active,
      lastSeen: row.last_seen,
      activePlan: row.active_plan,
      planStatus: row.plan_status,
      nextAppointment: row.next_appointment,
      cycleDay: row.cycle_day,
      cycleLength: row.cycle_length,
      nextPeriodDate: row.next_period_date,
      waterIntake: row.water_intake,
      targetWater: row.target_water,
      caloriesTarget: row.calories_target,
      proteinTarget: row.protein_target,
      symptoms: Array.isArray(row.symptoms) ? row.symptoms : [],
      bmi: row.bmi,
      wellnessScore: row.wellness_score,
      wellnessGoal: row.wellness_goal,
      personalNotes: row.personal_notes,
      doctorNote: row.doctor_note,
      profileCompleted: row.profile_completed,
      cycleStartDate: row.cycle_start_date,
      weight: row.weight,
      mood: row.mood,
      moodDate: row.mood_date,
      waterIntakeDate: row.water_intake_date,
      isPeriodTrackerEnabled: row.is_period_tracker_enabled ?? true,
      isPremium: row.is_premium ?? false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      sleep: row.sleep ?? 0,
      journal: row.journal
    };
  }

  async saveUserProfileHistory(history: CreateUserProfileHistoryInput): Promise<UserProfileHistory> {
    const { data, error } = await this.supabase
      .from(this.userProfileHistoryTableName)
      .insert({
        user_id: history.userId,
        date: history.date,
        water_intake: history.waterIntake,
        mood: history.mood,
        sleep: history.sleep ?? 0,
        cycle_day: history.cycleDay,
        symptoms: history.symptoms || [],
        journal: history.journal
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save user profile history: ${error.message}`);
    }

    return this.mapToUserProfileHistory(data);
  }

  async getUserProfileHistory(userId: string): Promise<UserProfileHistory[]> {
    const { data, error } = await this.supabase
      .from(this.userProfileHistoryTableName)
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user profile history: ${error.message}`);
    }

    return (data || []).map(row => this.mapToUserProfileHistory(row));
  }

  private mapToUserProfileHistory(row: any): UserProfileHistory {
    return {
      id: row.id,
      userId: row.user_id,
      date: row.date,
      waterIntake: row.water_intake,
      mood: row.mood,
      sleep: row.sleep ?? 0,
      cycleDay: row.cycle_day,
      symptoms: Array.isArray(row.symptoms) ? row.symptoms : [],
      createdAt: row.created_at,
      journal: row.journal
    };
  }

  async savePeriodHistory(history: CreatePeriodHistoryInput): Promise<PeriodHistory> {
    const { data, error } = await this.supabase
      .from(this.periodHistoryTableName)
      .insert({
        user_id: history.userId,
        start_date: history.startDate,
        end_date: history.endDate,
        symptoms: history.symptoms || [],
        notes: history.notes || ""
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save period history: ${error.message}`);
    }

    return this.mapToPeriodHistory(data);
  }

  async getPeriodHistory(userId: string): Promise<PeriodHistory[]> {
    const { data, error } = await this.supabase
      .from(this.periodHistoryTableName)
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch period history: ${error.message}`);
    }

    return (data || []).map(row => this.mapToPeriodHistory(row));
  }

  async updatePeriodHistory(id: string, updates: Partial<PeriodHistory>): Promise<PeriodHistory> {
    const dbUpdates: any = {};
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
    if (updates.symptoms !== undefined) dbUpdates.symptoms = updates.symptoms;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from(this.periodHistoryTableName)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update period history: ${error.message}`);
    }

    return this.mapToPeriodHistory(data);
  }

  private mapToPeriodHistory(row: any): PeriodHistory {
    return {
      id: row.id,
      userId: row.user_id,
      startDate: row.start_date,
      endDate: row.end_date,
      symptoms: Array.isArray(row.symptoms) ? row.symptoms : [],
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Appointment operations
  async createAppointment(appointment: CreateAppointmentInput): Promise<Appointment> {
    const { data, error } = await this.supabase
      .from(this.appointmentsTableName)
      .insert({
        user_id: appointment.userId,
        doctor_id: appointment.doctorId,
        doctor_name: appointment.doctorName,
        patient_name: appointment.patientName,
        patient_email: appointment.patientEmail,
        appointment_date: appointment.appointmentDate,
        status: appointment.status || 'scheduled',
        notes: appointment.notes
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create appointment: ${error.message}`);
    }

    return this.mapToAppointment(data);
  }

  async getUserAppointments(userId: string): Promise<Appointment[]> {
    const { data, error } = await this.supabase
      .from(this.appointmentsTableName)
      .select('*')
      .eq('user_id', userId)
      .order('appointment_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch appointments: ${error.message}`);
    }

    return data.map((row: any) => this.mapToAppointment(row));
  }

  async getDoctorAppointments(doctorId: string): Promise<Appointment[]> {
    const { data, error } = await this.supabase
      .from(this.appointmentsTableName)
      .select('*')
      .eq('doctor_id', doctorId)
      .order('appointment_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch doctor appointments: ${error.message}`);
    }

    return (data || []).map((row: any) => this.mapToAppointment(row));
  }

  async getAllAppointments(): Promise<Appointment[]> {
    const { data, error } = await this.supabase
      .from(this.appointmentsTableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch all appointments: ${error.message}`);
    }

    return (data || []).map((row: any) => this.mapToAppointment(row));
  }

  async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<Appointment> {
    const { data, error } = await this.supabase
      .from(this.appointmentsTableName)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update appointment status: ${error.message}`);
    }

    return this.mapToAppointment(data);
  }

  async deleteAppointment(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.appointmentsTableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete appointment: ${error.message}`);
    }
  }

  private mapToAppointment(row: any): Appointment {
    return {
      id: row.id,
      userId: row.user_id,
      doctorId: row.doctor_id,
      doctorName: row.doctor_name,
      patientName: row.patient_name,
      patientEmail: row.patient_email,
      appointmentDate: row.appointment_date,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Earning operations
  async getDoctorEarnings(doctorId: string): Promise<DoctorEarning[]> {
    const { data, error } = await this.supabase
      .from(this.doctorEarningsTableName)
      .select('*')
      .eq('doctor_id', doctorId)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch doctor earnings: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      doctorId: row.doctor_id,
      appointmentId: row.appointment_id,
      amount: row.amount,
      status: row.status,
      description: row.description,
      date: row.date,
      createdAt: row.created_at
    }));
  }

  async addDoctorEarning(earning: CreateDoctorEarningInput): Promise<DoctorEarning> {
    const { data, error } = await this.supabase
      .from(this.doctorEarningsTableName)
      .insert({
        doctor_id: earning.doctorId,
        appointment_id: earning.appointmentId,
        amount: earning.amount,
        status: earning.status,
        description: earning.description,
        date: earning.date
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add doctor earning: ${error.message}`);
    }

    return {
      id: data.id,
      doctorId: data.doctor_id,
      appointmentId: data.appointment_id,
      amount: data.amount,
      status: data.status,
      description: data.description,
      date: data.date,
      createdAt: data.created_at
    };
  }

  async getUserRole(email: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from(this.userRolesTableName)
      .select('role')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }

    return data ? data.role : null;
  }

  async createDoctorJoinRequest(request: CreateDoctorJoinRequestInput): Promise<DoctorJoinRequest> {
    const { data, error } = await this.supabase
      .from(this.doctorJoinRequestsTableName)
      .insert([{
        full_name: request.fullName,
        email: request.email,
        phone: request.phone,
        specialization: request.specialization,
        qualification: request.qualification,
        experience_years: request.experienceYears,
        hospital_clinic: request.hospitalClinic,
        city: request.city,
        consultation_mode: request.consultationMode,
        medical_registration_number: request.medicalRegistrationNumber,
        agreed_to_terms: request.agreedToTerms,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw new Error(`Failed to create doctor join request: ${error.message}`);
    return this.mapToDoctorJoinRequest(data);
  }

  async getDoctorJoinRequests(): Promise<DoctorJoinRequest[]> {
    const { data, error } = await this.supabase
      .from(this.doctorJoinRequestsTableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch doctor join requests: ${error.message}`);
    return (data || []).map(row => this.mapToDoctorJoinRequest(row));
  }

  async updateDoctorJoinRequestStatus(id: string, status: 'approved' | 'rejected'): Promise<DoctorJoinRequest> {
    const { data, error } = await this.supabase
      .from(this.doctorJoinRequestsTableName)
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update doctor join request status: ${error.message}`);

    // If approved, sync to user_roles
    if (status === 'approved' && data) {
      await this.supabase
        .from(this.userRolesTableName)
        .upsert([{ email: data.email, role: 'doctor' }], { onConflict: 'email' });
    }

    return this.mapToDoctorJoinRequest(data);
  }

  private mapToDoctorJoinRequest(row: any): DoctorJoinRequest {
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      specialization: row.specialization,
      qualification: row.qualification,
      experienceYears: row.experience_years,
      hospitalClinic: row.hospital_clinic,
      city: row.city,
      consultationMode: row.consultation_mode,
      medicalRegistrationNumber: row.medical_registration_number,
      agreedToTerms: row.agreed_to_terms,
      status: row.status,
      createdAt: row.created_at
    };
  }

  async saveOtp(email: string, otp: string, expiresAt: Date): Promise<void> {
    const { error } = await this.supabase
      .from(this.otpTableName)
      .upsert({ email, otp, expires_at: expiresAt.toISOString() }, { onConflict: 'email' });

    if (error) throw new Error(`Failed to save OTP: ${error.message}`);
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from(this.otpTableName)
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error || !data) return false;
    return true;
  }

  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.doctorsTableName) // Doctors/Users table
      .update({ password: hashedPassword, updated_at: new Date().toISOString() })
      .eq('email', email);

    if (error) throw new Error(`Failed to update password: ${error.message}`);
  }

  async upsertUserRole(email: string, role: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.userRolesTableName)
      .upsert({ email, role }, { onConflict: 'email' });

    if (error) throw new Error(`Failed to upsert user role: ${error.message}`);
  }

  // ==========================================
  // MAP HELPERS FOR CLASSES MODULE
  // ==========================================
  private mapToClassCategory(row: any): ClassCategory {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      createdAt: row.created_at,
    };
  }

  private mapToWellnessClass(row: any): WellnessClass {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      thumbnailUrl: row.thumbnail_url,
      videoUrl: row.video_url,
      youtubeVideoId: row.youtube_video_id,
      googleMeetLink: row.google_meet_link || undefined,
      scheduledAt: row.scheduled_at || undefined,
      instructorName: row.instructor_name,
      duration: row.duration,
      categoryId: row.category_id,
      isFeatured: row.is_featured || false,
      isActive: row.is_active !== false,
      tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? JSON.parse(row.tags) : []),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToVideoPlacement(row: any): VideoPlacement {
    return {
      id: row.id,
      label: row.label,
      description: row.description,
      classId: row.class_id || undefined,
      isActive: row.is_active !== false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToClassAttendance(row: any): ClassAttendance {
    return {
      id: row.id,
      userId: row.user_id,
      classId: row.class_id,
      joinedAt: row.joined_at,
      leftAt: row.left_at || undefined,
      watchDuration: row.watch_duration || 0,
      completionPercentage: row.completion_percentage || 0,
      isCompleted: row.is_completed || false,
      interactionJoined: row.interaction_joined || false,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ==========================================
  // CLASSES CATEGORIES
  // ==========================================
  async createClassCategory(category: CreateClassCategoryInput): Promise<ClassCategory> {
    const { data, error } = await this.supabase
      .from(this.classCategoriesTableName)
      .insert({
        name: category.name,
        slug: category.slug,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create class category: ${error.message}`);
    return this.mapToClassCategory(data);
  }

  async getClassCategories(): Promise<ClassCategory[]> {
    const { data, error } = await this.supabase
      .from(this.classCategoriesTableName)
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(`Failed to fetch class categories: ${error.message}`);
    return (data || []).map(row => this.mapToClassCategory(row));
  }

  async deleteClassCategory(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.classCategoriesTableName)
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete class category: ${error.message}`);
    return true;
  }

  // ==========================================
  // WELLNESS CLASSES
  // ==========================================
  async createWellnessClass(cls: CreateWellnessClassInput): Promise<WellnessClass> {
    const { data, error } = await this.supabase
      .from(this.classesTableName)
      .insert({
        title: cls.title,
        description: cls.description,
        type: cls.type,
        thumbnail_url: cls.thumbnailUrl,
        video_url: cls.videoUrl,
        youtube_video_id: cls.youtubeVideoId,
        google_meet_link: cls.googleMeetLink || null,
        scheduled_at: cls.scheduledAt || null,
        instructor_name: cls.instructorName,
        duration: cls.duration,
        category_id: cls.categoryId,
        is_featured: cls.isFeatured || false,
        is_active: cls.isActive !== false,
        tags: Array.isArray(cls.tags) ? cls.tags : [],
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create wellness class: ${error.message}`);
    return this.mapToWellnessClass(data);
  }

  async getWellnessClasses(filters?: { type?: 'live' | 'recorded'; categoryId?: string; isFeatured?: boolean; isActive?: boolean }): Promise<WellnessClass[]> {
    let query = this.supabase.from(this.classesTableName).select('*');

    if (filters) {
      if (filters.type) query = query.eq('type', filters.type);
      if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
      if (filters.isFeatured !== undefined) query = query.eq('is_featured', filters.isFeatured);
      if (filters.isActive !== undefined) query = query.eq('is_active', filters.isActive);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch wellness classes: ${error.message}`);
    return (data || []).map(row => this.mapToWellnessClass(row));
  }

  async getWellnessClassById(id: string): Promise<WellnessClass | null> {
    const { data, error } = await this.supabase
      .from(this.classesTableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch wellness class by id: ${error.message}`);
    if (!data) return null;
    return this.mapToWellnessClass(data);
  }

  async updateWellnessClass(id: string, updates: Partial<WellnessClass>): Promise<WellnessClass> {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.thumbnailUrl !== undefined) dbUpdates.thumbnail_url = updates.thumbnailUrl;
    if (updates.videoUrl !== undefined) dbUpdates.video_url = updates.videoUrl;
    if (updates.youtubeVideoId !== undefined) dbUpdates.youtube_video_id = updates.youtubeVideoId;
    if (updates.googleMeetLink !== undefined) dbUpdates.google_meet_link = updates.googleMeetLink || null;
    if (updates.scheduledAt !== undefined) dbUpdates.scheduled_at = updates.scheduledAt || null;
    if (updates.instructorName !== undefined) dbUpdates.instructor_name = updates.instructorName;
    if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
    if (updates.isFeatured !== undefined) dbUpdates.is_featured = updates.isFeatured;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from(this.classesTableName)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update wellness class: ${error.message}`);
    return this.mapToWellnessClass(data);
  }

  async deleteWellnessClass(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.classesTableName)
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete wellness class: ${error.message}`);
    return true;
  }

  // ==========================================
  // VIDEO PLACEMENTS
  // ==========================================
  async getVideoPlacements(): Promise<VideoPlacement[]> {
    const { data, error } = await this.supabase
      .from(this.videoPlacementsTableName)
      .select('*')
      .order('label', { ascending: true });

    if (error) throw new Error(`Failed to fetch video placements: ${error.message}`);
    return (data || []).map(row => this.mapToVideoPlacement(row));
  }

  async updateVideoPlacement(id: string, updates: UpdateVideoPlacementInput): Promise<VideoPlacement> {
    const dbUpdates: any = {};
    if (updates.classId !== undefined) dbUpdates.class_id = updates.classId || null;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from(this.videoPlacementsTableName)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update video placement: ${error.message}`);
    return this.mapToVideoPlacement(data);
  }

  // ==========================================
  // CLASS ATTENDANCE
  // ==========================================
  async recordClassAttendance(attendance: RecordClassAttendanceInput): Promise<ClassAttendance> {
    const { data: existing, error: checkError } = await this.supabase
      .from(this.classAttendanceTableName)
      .select('*')
      .eq('user_id', attendance.userId)
      .eq('class_id', attendance.classId)
      .maybeSingle();

    if (checkError) throw new Error(`Failed to check existing attendance: ${checkError.message}`);

    const dbPayload: any = {
      user_id: attendance.userId,
      class_id: attendance.classId,
    };

    if (attendance.joinedAt !== undefined) dbPayload.joined_at = attendance.joinedAt;
    if (attendance.leftAt !== undefined) dbPayload.left_at = attendance.leftAt;
    if (attendance.watchDuration !== undefined) dbPayload.watch_duration = attendance.watchDuration;
    if (attendance.completionPercentage !== undefined) dbPayload.completion_percentage = attendance.completionPercentage;
    if (attendance.isCompleted !== undefined) dbPayload.is_completed = attendance.isCompleted;
    if (attendance.interactionJoined !== undefined) dbPayload.interaction_joined = attendance.interactionJoined;

    dbPayload.updated_at = new Date().toISOString();

    let result;
    if (existing) {
      const { data, error } = await this.supabase
        .from(this.classAttendanceTableName)
        .update(dbPayload)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw new Error(`Failed to update class attendance: ${error.message}`);
      result = data;
    } else {
      dbPayload.joined_at = dbPayload.joined_at || new Date().toISOString();
      const { data, error } = await this.supabase
        .from(this.classAttendanceTableName)
        .insert(dbPayload)
        .select()
        .single();
      if (error) throw new Error(`Failed to insert class attendance: ${error.message}`);
      result = data;
    }

    return this.mapToClassAttendance(result);
  }

  async getClassAttendance(userId: string): Promise<ClassAttendance[]> {
    const { data, error } = await this.supabase
      .from(this.classAttendanceTableName)
      .select('*')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch class attendance: ${error.message}`);
    return (data || []).map(row => this.mapToClassAttendance(row));
  }

  async getAllClassAttendance(): Promise<ClassAttendance[]> {
    const { data, error } = await this.supabase
      .from(this.classAttendanceTableName)
      .select('*')
      .order('joined_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch all class attendance: ${error.message}`);
    return (data || []).map(row => this.mapToClassAttendance(row));
  }

  // ==========================================
  // LIVE CHAT SYSTEM
  // ==========================================
  private mapToLiveChatMessage(row: any): LiveChatMessage {
    return {
      id: row.id,
      classId: row.class_id,
      userId: row.user_id,
      senderName: row.sender_name,
      senderRole: row.sender_role,
      message: row.message,
      createdAt: row.created_at,
    };
  }

  async createLiveChatMessage(input: CreateLiveChatMessageInput): Promise<LiveChatMessage> {
    const { data, error } = await this.supabase
      .from(this.liveChatsTableName)
      .insert({
        class_id: input.classId,
        user_id: input.userId,
        sender_name: input.senderName,
        sender_role: input.senderRole,
        message: input.message,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to save live chat message: ${error.message}`);
    return this.mapToLiveChatMessage(data);
  }

  async getLiveChatMessages(classId: string): Promise<LiveChatMessage[]> {
    const { data, error } = await this.supabase
      .from(this.liveChatsTableName)
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch live chat messages: ${error.message}`);
    return (data || []).map(row => this.mapToLiveChatMessage(row));
  }

  // Banner operations mapping
  private mapToBanner(row: any): Banner {
    return {
      id: row.id,
      title: row.title,
      imageUrl: row.image_url,
      targetUrl: row.target_url || undefined,
      position: row.position,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToBannerDbRow(banner: CreateBannerInput | UpdateBannerInput) {
    const row: any = {};
    if (banner.title !== undefined) row.title = banner.title;
    if (banner.imageUrl !== undefined) row.image_url = banner.imageUrl;
    if (banner.targetUrl !== undefined) row.target_url = banner.targetUrl;
    if (banner.position !== undefined) row.position = banner.position;
    if (banner.isActive !== undefined) row.is_active = banner.isActive;
    return row;
  }

  async createBanner(banner: CreateBannerInput): Promise<Banner> {
    const { data, error } = await this.supabase
      .from(this.bannersTableName)
      .insert(this.mapToBannerDbRow(banner))
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create banner: ${error.message}`);
    }

    return this.mapToBanner(data);
  }

  async getBannerById(id: string): Promise<Banner | null> {
    const { data, error } = await this.supabase
      .from(this.bannersTableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch banner by id: ${error.message}`);
    }

    return data ? this.mapToBanner(data) : null;
  }

  async getPaginatedBanners(page: number, limit: number): Promise<PaginatedResult<Banner>> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await this.supabase
      .from(this.bannersTableName)
      .select('*', { count: 'exact' })
      .order('position', { ascending: true })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch paginated banners: ${error.message}`);
    }

    return {
      data: data.map(row => this.mapToBanner(row)),
      total: count || 0,
      page,
      limit,
    };
  }

  async getActiveBanners(): Promise<Banner[]> {
    const { data, error } = await this.supabase
      .from(this.bannersTableName)
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch active banners: ${error.message}`);
    }

    return data.map(row => this.mapToBanner(row));
  }

  async updateBanner(id: string, banner: UpdateBannerInput): Promise<Banner> {
    const { data, error } = await this.supabase
      .from(this.bannersTableName)
      .update(this.mapToBannerDbRow(banner))
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update banner: ${error.message}`);
    }

    return this.mapToBanner(data);
  }

  async deleteBanner(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.bannersTableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete banner: ${error.message}`);
    }
  }

  // Nutrition & Diet Management Mappers & Methods
  private mapToFood(row: any): Food {
    return {
      id: row.id,
      name: row.name,
      calories: row.calories,
      protein: Number(row.protein || 0),
      carbs: Number(row.carbs || 0),
      fats: Number(row.fats || 0),
      category: row.category,
      createdAt: row.created_at
    };
  }

  private mapToDietPlan(row: any): DietPlan {
    return {
      id: row.id,
      userId: row.user_id,
      userIds: [row.user_id],
      name: row.name,
      description: row.description,
      patientAge: row.patient_age,
      patientHeight: row.patient_height,
      patientWeight: row.patient_weight,
      patientGoal: row.patient_goal,
      patientDiet: row.patient_diet,
      dietData: (row.diet_data || []) as DayDietPlan[],
      foodsToAvoid: row.foods_to_avoid || [],
      dailyTargets: row.daily_targets || [],
      pdfUrl: row.pdf_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapToMealLog(row: any): MealLog {
    return {
      id: row.id,
      userId: row.user_id,
      dietPlanId: row.diet_plan_id,
      date: row.date,
      day: row.day,
      mealIndex: row.meal_index,
      mealName: row.meal_name,
      status: row.status as 'completed' | 'delayed' | 'skipped',
      completionTime: row.completion_time,
      dailyCompletionPercentage: Number(row.daily_completion_percentage || 0),
      createdAt: row.created_at
    };
  }

  async createFood(food: Omit<Food, 'id' | 'createdAt'>): Promise<Food> {
    const { data, error } = await this.supabase
      .from(this.foodsTableName)
      .insert({
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats,
        category: food.category
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create food: ${error.message}`);
    }
    return this.mapToFood(data);
  }

  async searchFoods(query: string): Promise<Food[]> {
    const { data, error } = await this.supabase
      .from(this.foodsTableName)
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
      .limit(20);

    if (error) {
      throw new Error(`Failed to search foods: ${error.message}`);
    }
    return (data || []).map(row => this.mapToFood(row));
  }

  async createDietPlan(plan: Omit<DietPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<DietPlan> {
    const { data, error } = await this.supabase
      .from(this.dietPlansTableName)
      .insert({
        user_id: plan.userId,
        name: plan.name,
        description: plan.description,
        patient_age: plan.patientAge,
        patient_height: plan.patientHeight,
        patient_weight: plan.patientWeight,
        patient_goal: plan.patientGoal,
        patient_diet: plan.patientDiet,
        diet_data: plan.dietData,
        foods_to_avoid: plan.foodsToAvoid,
        daily_targets: plan.dailyTargets,
        pdf_url: plan.pdfUrl
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create diet plan: ${error.message}`);
    }
    return this.mapToDietPlan(data);
  }

  async getDietPlanByUserId(userId: string): Promise<DietPlan | null> {
    const { data, error } = await this.supabase
      .from(this.dietPlansTableName)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Failed to fetch diet plan by user ID: ${error.message}`);
    }
    return data && data.length > 0 ? this.mapToDietPlan(data[0]) : null;
  }

  async getDietPlanById(id: string): Promise<DietPlan | null> {
    const { data, error } = await this.supabase
      .from(this.dietPlansTableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch diet plan by ID: ${error.message}`);
    }
    return data ? this.mapToDietPlan(data) : null;
  }

  async getPaginatedDietPlans(page: number, limit: number): Promise<PaginatedResult<DietPlan>> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await this.supabase
      .from(this.dietPlansTableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch paginated diet plans: ${error.message}`);
    }

    return {
      data: (data || []).map(row => this.mapToDietPlan(row)),
      total: count || 0,
      page,
      limit
    };
  }

  async updateDietPlan(id: string, updates: Partial<DietPlan>): Promise<DietPlan> {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.patientAge !== undefined) dbUpdates.patient_age = updates.patientAge;
    if (updates.patientHeight !== undefined) dbUpdates.patient_height = updates.patientHeight;
    if (updates.patientWeight !== undefined) dbUpdates.patient_weight = updates.patientWeight;
    if (updates.patientGoal !== undefined) dbUpdates.patient_goal = updates.patientGoal;
    if (updates.patientDiet !== undefined) dbUpdates.patient_diet = updates.patientDiet;
    if (updates.dietData !== undefined) dbUpdates.diet_data = updates.dietData;
    if (updates.foodsToAvoid !== undefined) dbUpdates.foods_to_avoid = updates.foodsToAvoid;
    if (updates.dailyTargets !== undefined) dbUpdates.daily_targets = updates.dailyTargets;
    if (updates.pdfUrl !== undefined) dbUpdates.pdf_url = updates.pdfUrl;
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from(this.dietPlansTableName)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update diet plan: ${error.message}`);
    }
    return this.mapToDietPlan(data);
  }

  async deleteDietPlan(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.dietPlansTableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete diet plan: ${error.message}`);
    }
  }

  async trackMeal(log: Omit<MealLog, 'id' | 'createdAt'>): Promise<MealLog> {
    const { data, error } = await this.supabase
      .from(this.mealLogsTableName)
      .upsert({
        user_id: log.userId,
        diet_plan_id: log.dietPlanId,
        date: log.date,
        day: log.day,
        meal_index: log.mealIndex,
        meal_name: log.mealName,
        status: log.status,
        completion_time: log.completionTime,
        daily_completion_percentage: log.dailyCompletionPercentage
      }, {
        onConflict: 'user_id,date,day,meal_index'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to track meal: ${error.message}`);
    }
    return this.mapToMealLog(data);
  }

  async getMealLogs(userId: string, startDate: string, endDate: string): Promise<MealLog[]> {
    const { data, error } = await this.supabase
      .from(this.mealLogsTableName)
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('meal_index', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch meal logs: ${error.message}`);
    }
    return (data || []).map(row => this.mapToMealLog(row));
  }

  async getMealLogsByDate(userId: string, date: string): Promise<MealLog[]> {
    const { data, error } = await this.supabase
      .from(this.mealLogsTableName)
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('meal_index', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch meal logs by date: ${error.message}`);
    }
    return (data || []).map(row => this.mapToMealLog(row));
  }

  async deleteMealLog(userId: string, date: string, day: number, mealIndex: number): Promise<void> {
    const { error } = await this.supabase
      .from(this.mealLogsTableName)
      .delete()
      .eq('user_id', userId)
      .eq('date', date)
      .eq('day', day)
      .eq('meal_index', mealIndex);

    if (error) {
      throw new Error(`Failed to delete meal log: ${error.message}`);
    }
  }
}

