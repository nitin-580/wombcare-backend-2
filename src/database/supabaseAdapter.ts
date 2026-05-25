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
  CreateDoctorEarningInput
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

  constructor() {
    this.supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }

  // Map database row to Domain User object
  private mapToUser(row: any): User {
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
      source: row.source,
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
    startOfWeek.setHours(0,0,0,0);
    
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

    const { data, error, count } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Failed to fetch paginated users: ${error.message}`);
    }

    return {
      data: data.map(this.mapToUser),
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

    const { data, error, count } = await this.supabase
      .from(this.doctorsTableName)
      .select('*', { count: 'exact' })
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
        is_premium: profile.isPremium ?? false
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
}
