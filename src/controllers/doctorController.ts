import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { DoctorRepository } from "../repositories/doctorRepository";
import { PatientRepository } from "../repositories/patientRepository";
import { env } from "../config/env";
import { UserProfileRepository } from "../repositories/userProfileRepository";
import { CreateDoctorInput, UpdateDoctorInput } from "../database/interfaces";
import { sendWelcomeMail } from "../lib/sendWelcomeMail";
import { sendDoctorApplicationMail, sendDoctorApprovalMail } from "../lib/sendDoctorMails";
import { AppointmentRepository } from "../repositories/appointmentRepository";
import { EarningsRepository } from "../repositories/earningsRepository";
import { SupabaseAdapter } from "../database/supabaseAdapter";

export class DoctorController {
  constructor(
    private doctorRepo: DoctorRepository,
    private patientRepo: PatientRepository,
    private profileRepo: UserProfileRepository,
    private appointmentRepo: AppointmentRepository,
    private earningsRepo: EarningsRepository
  ) {}

  signupDoctor = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        email,
        password,
        phone,
        specialization,
        credentials,
        profilePicture,
      } = req.body;

      const existingDoctor = await this.doctorRepo.findByEmail(email);

      if (existingDoctor) {
        res.status(400).json({ success: false, message: "Doctor already exists" });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const referralCode = "DOC" + Math.floor(100000 + Math.random() * 900000);

      const doctorData: CreateDoctorInput = {
        name, email, password: hashedPassword, phone,
        specialization, credentials, profilePicture, referralCode,
      };

      const doctor = await this.doctorRepo.create(doctorData);
      
      // Sync to user_roles as 'user' by default (Doctor role assigned by admin)
      await this.doctorRepo.upsertUserRole(doctor.email, 'user').catch(console.error);

      sendWelcomeMail(doctor.email, doctor.name).catch(console.error);

      const { password: _, ...doctorResponse } = doctor as any;
      res.status(201).json({ success: true, message: "Doctor registered successfully", doctor: doctorResponse });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  signupTeacher = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        email,
        password,
        phone,
        specialization,
        credentials,
        profilePicture,
      } = req.body;

      const existingDoctor = await this.doctorRepo.findByEmail(email);

      if (existingDoctor) {
        res.status(400).json({ success: false, message: "Teacher account already exists with this email" });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const referralCode = "TCH" + Math.floor(100000 + Math.random() * 900000);

      const teacherData: CreateDoctorInput = {
        name, email, password: hashedPassword, phone,
        specialization: specialization || "Instructor", credentials: credentials || "Teacher", profilePicture, referralCode,
      };

      const doctor = await this.doctorRepo.create(teacherData);
      
      // Sync to user_roles directly as 'teacher'
      await this.doctorRepo.upsertUserRole(doctor.email, 'teacher').catch(console.error);

      sendWelcomeMail(doctor.email, doctor.name).catch(console.error);

      const { password: _, ...doctorResponse } = doctor as any;
      res.status(201).json({ success: true, message: "Teacher registered successfully", teacher: doctorResponse });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  loginDoctor = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const doctor = await this.doctorRepo.findByEmail(email);

      if (!doctor || !doctor.password) {
        res.status(404).json({ success: false, message: "Doctor not found" });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, doctor.password);
      if (!isValidPassword) {
        res.status(401).json({ success: false, message: "Invalid credentials" });
        return;
      }

      // Enforce Max 2 IP limit
      const db = new SupabaseAdapter();
      const clientIp = (
        (req.headers['x-forwarded-for'] as string) ||
        req.ip ||
        req.socket.remoteAddress ||
        'unknown'
      ).split(',')[0].trim();

      // Clear sessions older than 24 hours
      await db.clearStaleUserIps(doctor.id);

      // Get current active IPs
      const activeIps = await db.getUserActiveIps(doctor.id);
      const ipList = activeIps.map(item => item.ipAddress);

      if (!ipList.includes(clientIp)) {
        if (activeIps.length >= 2) {
          res.status(403).json({
            success: false,
            message: "Access Denied: Maximum of 2 concurrent IP addresses allowed. Please log out from other devices."
          });
          return;
        }
        await db.upsertUserIp(doctor.id, clientIp);
      } else {
        await db.upsertUserIp(doctor.id, clientIp);
      }

      // Fetch role and onboarding status
      const [role, profile] = await Promise.all([
        this.doctorRepo.getUserRole(email),
        this.profileRepo.getById(doctor.id).catch(() => null)
      ]);

      const userRole = role || 'user';
      const token = jwt.sign({ id: doctor.id, email: doctor.email, role: userRole }, env.JWT_SECRET, { expiresIn: "30d" });

      const { password: _, ...doctorResponse } = doctor as any;
      res.status(200).json({ 
        success: true, 
        token, 
        role: role || 'user',
        onboardingCompleted: profile?.profileCompleted || false,
        doctor: doctorResponse 
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getDoctorProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }
      const doctor = await this.doctorRepo.findById(doctorId);
      if (!doctor) {
        res.status(404).json({ success: false, message: "Doctor not found" });
        return;
      }
      const patients = await this.patientRepo.findByDoctor(doctorId);
      const { password: _, ...doctorResponse } = doctor as any;
      res.status(200).json({ success: true, doctor: doctorResponse, totalPatients: patients.length, referredPatients: patients });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  updateDoctorProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }
      const updateData: UpdateDoctorInput = req.body;
      delete (updateData as any).password;
      const updatedDoctor = await this.doctorRepo.update(doctorId, updateData);
      if (!updatedDoctor) {
        res.status(404).json({ success: false, message: "Doctor not found" });
        return;
      }
      const { password: _, ...doctorResponse } = updatedDoctor as any;
      res.status(200).json({ success: true, message: "Profile updated successfully", doctor: doctorResponse });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getDoctorPatients = async (req: Request, res: Response): Promise<void> => {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }
      const patients = await this.patientRepo.findByDoctor(doctorId);
      res.status(200).json({ success: true, total: patients.length, patients });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  roleCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      const email = req.query.email as string;
      if (!email) {
        res.status(400).json({ success: false, message: "Email required" });
        return;
      }
      const role = await this.doctorRepo.getUserRole(email);
      res.status(200).json({ success: true, role: role || 'user' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  createJoinRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      
      // Step 1: Check if email already exists in the users table
      const existingUser = await this.doctorRepo.findByEmail(email);
      if (existingUser) {
        res.status(400).json({ 
          success: false, 
          message: "This email is already registered as a user. Please use a different professional email for your doctor application." 
        });
        return;
      }

      const data = await this.doctorRepo.createJoinRequest(req.body);
      sendDoctorApplicationMail(data.email, data.fullName, data.medicalRegistrationNumber).catch(console.error);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getJoinRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.doctorRepo.getJoinRequests();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  updateJoinRequestStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, status } = req.body;
      const data = await this.doctorRepo.updateJoinRequestStatus(id, status);
      
      if (status === 'approved') {
        const tempPassword = `WC@${Math.floor(1000 + Math.random() * 9000)}`;
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        await this.doctorRepo.create({
          name: data.fullName,
          email: data.email,
          password: hashedPassword,
          phone: data.phone,
          specialization: data.specialization,
          credentials: data.qualification,
          referralCode: 'DOC' + Math.floor(100000 + Math.random() * 900000)
        });
        await this.doctorRepo.upsertUserRole(data.email, 'doctor').catch(console.error);
        sendDoctorApprovalMail(data.email, data.fullName, tempPassword).catch(console.error);
      }
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getDoctorAppointments = async (req: Request, res: Response): Promise<void> => {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }
      const appointments = await this.appointmentRepo.getByDoctorId(doctorId);
      res.status(200).json({ success: true, appointments });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  updateAppointmentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const doctorId = req.user?.id;
      const { appointmentId, status } = req.body;
      if (!doctorId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }
      const updated = await this.appointmentRepo.updateStatus(appointmentId, status);
      res.status(200).json({ success: true, message: `Status updated to ${status}`, appointment: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getDoctorEarnings = async (req: Request, res: Response): Promise<void> => {
    try {
      const doctorId = req.user?.id;
      if (!doctorId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }
      const earnings = await this.earningsRepo.getByDoctorId(doctorId);
      // Filter earnings to only show transferred ones (processed in DB)
      const transferredEarnings = earnings.filter(e => e.status === 'processed');
      const totalEarnings = transferredEarnings.reduce((acc, curr) => acc + curr.amount, 0);
      res.status(200).json({ success: true, earnings: transferredEarnings, totalEarnings });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  listDoctors = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      const paginated = await this.doctorRepo.getPaginated(page, limit);
      res.status(200).json({ success: true, data: paginated.data, total: paginated.total });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  adminAddEarning = async (req: Request, res: Response): Promise<void> => {
    try {
      const { doctorId, amount, description, status, date } = req.body;
      if (!doctorId || amount === undefined) {
        res.status(400).json({ success: false, message: "Doctor ID and Amount are required." });
        return;
      }
      const earning = await this.earningsRepo.create({
        doctorId,
        amount: Number(amount),
        description: description || "Commission",
        status: status || "processed",
        date: date || new Date().toISOString()
      });
      res.status(201).json({ success: true, message: "Earning added successfully", data: earning });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  adminGetDoctorEarnings = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const earnings = await this.earningsRepo.getByDoctorId(id as string);
      const transferredEarnings = earnings.filter(e => e.status === 'processed');
      const totalEarnings = transferredEarnings.reduce((acc, curr) => acc + curr.amount, 0);
      res.status(200).json({ success: true, earnings, totalEarnings });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  adminUpdateDoctorProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateDoctorInput = req.body;
      const updatedDoctor = await this.doctorRepo.update(id as string, updateData);
      if (!updatedDoctor) {
        res.status(404).json({ success: false, message: "Doctor not found" });
        return;
      }
      const { password: _, ...doctorResponse } = updatedDoctor as any;
      res.status(200).json({ success: true, message: "Doctor updated successfully", doctor: doctorResponse });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  logoutOtherDevices = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ success: false, message: "Email and password are required" });
        return;
      }

      const doctor = await this.doctorRepo.findByEmail(email);
      if (!doctor || !doctor.password) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, doctor.password);
      if (!isValidPassword) {
        res.status(401).json({ success: false, message: "Invalid credentials" });
        return;
      }

      const db = new SupabaseAdapter();
      await db.clearAllUserIps(doctor.id);

      res.status(200).json({ success: true, message: "Successfully logged out from all other devices. You can now log in." });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  adminGetActiveDoctors = async (req: Request, res: Response): Promise<void> => {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

      // 1. Fetch user roles where role is doctor from user_roles
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('email')
        .eq('role', 'doctor');

      if (roleError) throw roleError;

      // 2. Fetch approved doctor requests (who might not have registered a user record yet)
      const { data: approvedReqs, error: approvedError } = await supabase
        .from('doctor_join_requests')
        .select('full_name, email, phone, specialization, medical_registration_number, status')
        .eq('status', 'approved');

      if (approvedError) throw approvedError;

      const emails = (roleData || []).map((r: any) => r.email);
      const approvedEmails = (approvedReqs || []).map((r: any) => r.email);
      const allEmails = Array.from(new Set([...emails, ...approvedEmails].map(e => e.toLowerCase())));

      let usersData: any[] = [];
      if (allEmails.length > 0) {
        const { data: fetchUsers, error: fetchUsersError } = await supabase
          .from('users')
          .select('id, name, email, phone, specialization, credentials, referral_code, created_at')
          .in('email', allEmails);

        if (fetchUsersError) throw fetchUsersError;
        
        if (fetchUsers) {
          usersData = fetchUsers.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            specialization: u.specialization,
            credentials: u.credentials,
            referralCode: u.referral_code || '',
            created_at: u.created_at
          }));
        }
      }

      const mergedDoctors = [...usersData];

      // Merge in approved requests that may not have user entries yet
      if (approvedReqs) {
        for (const req of approvedReqs) {
          if (!mergedDoctors.some(d => d.email.toLowerCase() === req.email.toLowerCase())) {
            mergedDoctors.push({
              id: req.email,
              name: req.full_name,
              email: req.email,
              phone: req.phone || '',
              specialization: req.specialization || '',
              credentials: req.medical_registration_number || '',
              referralCode: '',
              created_at: new Date().toISOString()
            });
          }
        }
      }

      // 3. Fetch user roles where role is user
      const { data: userRoleData, error: userRoleError } = await supabase
        .from('user_roles')
        .select('email')
        .eq('role', 'user');

      if (userRoleError) throw userRoleError;

      const userEmails = (userRoleData || []).map((r: any) => r.email);
      let registrations: any[] = [];

      if (userEmails.length > 0) {
        const { data: regData, error: regError } = await supabase
          .from('users')
          .select('id, name, email, phone')
          .in('email', userEmails);

        if (regError) throw regError;

        const { data: profilesData, error: profilesError } = await supabase
          .from('wombcare_user_profiles')
          .select('email, age, weight, cycle_length, symptoms')
          .in('email', userEmails);

        if (profilesError) {
          console.error('Error fetching user profiles:', profilesError);
        }

        registrations = (regData || []).map((u: any) => {
          const profile = (profilesData || []).find((p: any) => p.email?.toLowerCase() === u.email?.toLowerCase());
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone || '',
            age: profile?.age || 0,
            weight: profile?.weight || 0,
            cycleRegularity: profile?.cycle_length ? `${profile.cycle_length} days` : 'Regular',
            symptoms: Array.isArray(profile?.symptoms) ? profile.symptoms.join(', ') : (profile?.symptoms || ''),
            country: 'India'
          };
        });
      }

      res.status(200).json({
        success: true,
        doctors: mergedDoctors,
        registrations: registrations
      });
    } catch (error: any) {
      console.error('adminGetActiveDoctors error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  adminMapUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

      const { action, user, doctorId, doctorName, doctorReferralCode, isManual } = req.body;

      if (isManual) {
        if (action === 'patient') {
          // 1. Generate temp password & hash it
          const tempPassword = 'WombCare@' + Math.floor(1000 + Math.random() * 9000);
          const hashedPassword = await bcrypt.hash(tempPassword, 10);

          // 2. Insert into users table
          const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert([{
              name: user.name,
              email: user.email.toLowerCase(),
              password: hashedPassword,
              phone: user.phone || ''
            }])
            .select()
            .single();

          if (userError) throw userError;

          // 3. Insert into user_roles table
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert([{
              email: user.email.toLowerCase(),
              role: 'user'
            }]);

          if (roleError) throw roleError;

          // 4. Insert into wombcare_user_profiles table
          const { error: profileError } = await supabase
            .from('wombcare_user_profiles')
            .insert([{
              id: newUser.id,
              name: user.name,
              email: user.email.toLowerCase(),
              age: Number(user.age) || 0,
              weight: Number(user.weight) || 0,
              symptoms: user.symptoms ? [user.symptoms] : [],
              profile_completed: false,
              active_plan: 'Premium 90 Day Wellness Plan',
              plan_status: 'active',
              is_premium: true
            }]);

          if (profileError) throw profileError;

          // 5. Insert into patients table
          const { error: patientError } = await supabase
            .from('patients')
            .insert([{
              name: user.name,
              email: user.email.toLowerCase(),
              phone: user.phone || '',
              age: Number(user.age) || 0,
              weight: Number(user.weight) || 0,
              cycle_regular: 'Regular',
              symptoms: user.symptoms || '',
              country: user.country || 'India',
              referred_by: doctorId
            }]);

          if (patientError) throw patientError;

          // 6. Send welcome email containing login credentials
          try {
            const { sendReferralWelcomeMail } = require('../lib/sendReferralWelcomeMail');
            await sendReferralWelcomeMail(user.email.toLowerCase(), user.name, tempPassword);
          } catch (mailErr) {
            console.error('Failed to send welcome email:', mailErr);
          }
        } else {
          // Referral manual mapping
          const { error: referralError } = await supabase
            .from('referrals')
            .insert([{
              patient_name: user.name,
              mobile: user.phone || '',
              email: user.email.toLowerCase(),
              problem: user.symptoms || '',
              doctor_id: doctorId,
              doctor_referral_code: doctorReferralCode || '',
              referral_status: 'pending'
            }]);

          if (referralError) throw referralError;

          // Send informative email
          try {
            const { sendReferralInformativeMail } = require('../lib/sendReferralWelcomeMail');
            await sendReferralInformativeMail(user.email.toLowerCase(), user.name, doctorName || 'your Doctor');
          } catch (mailErr) {
            console.error('Failed to send referral email:', mailErr);
          }
        }
      } else {
        // Map existing registration
        if (action === 'patient') {
          const { error } = await supabase
            .from('patients')
            .insert([{
              name: user.name,
              email: user.email,
              phone: user.phone || '',
              age: Number(user.age) || 0,
              weight: Number(user.weight) || 0,
              cycle_regular: user.cycleRegularity || 'Regular',
              symptoms: user.symptoms || '',
              country: user.country || 'India',
              referred_by: doctorId
            }]);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('referrals')
            .insert([{
              patient_name: user.name,
              mobile: user.phone || '',
              email: user.email,
              problem: user.symptoms || '',
              doctor_id: doctorId,
              doctor_referral_code: doctorReferralCode || '',
              referral_status: 'pending'
            }]);

          if (error) throw error;
        }
      }

      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('adminMapUser error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  adminSearchUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

      const q = (req.query.q as string || '').trim();
      if (!q || q.length < 2) {
        res.status(200).json({ success: true, data: [] });
        return;
      }

      // 1. Fetch all doctor emails from user_roles to exclude them
      const { data: doctorRoleData, error: doctorRoleError } = await supabase
        .from('user_roles')
        .select('email')
        .eq('role', 'doctor');

      if (doctorRoleError) throw doctorRoleError;

      const doctorEmails = (doctorRoleData || []).map((r: any) => r.email.toLowerCase());

      // 2. Fetch users matching search query (name or email) limited to 20 records
      let queryBuilder = supabase
        .from('users')
        .select('id, name, email, phone')
        .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(20);

      if (doctorEmails.length > 0) {
        queryBuilder = queryBuilder.not('email', 'in', `(${doctorEmails.join(',')})`);
      }

      const { data: matchedUsers, error: matchError } = await queryBuilder;

      if (matchError) throw matchError;

      // 3. Fetch user profiles to attach additional metrics
      let result = [];
      if (matchedUsers && matchedUsers.length > 0) {
        const matchedEmails = matchedUsers.map((u: any) => u.email);
        const { data: profilesData } = await supabase
          .from('wombcare_user_profiles')
          .select('email, age, weight, cycle_length, symptoms')
          .in('email', matchedEmails);

        result = matchedUsers.map((u: any) => {
          const profile = (profilesData || []).find((p: any) => p.email?.toLowerCase() === u.email?.toLowerCase());
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone || '',
            age: profile?.age || 0,
            weight: profile?.weight || 0,
            cycleRegularity: profile?.cycle_length ? `${profile.cycle_length} days` : 'Regular',
            symptoms: Array.isArray(profile?.symptoms) ? profile.symptoms.join(', ') : (profile?.symptoms || ''),
            country: 'India'
          };
        });
      }

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error('adminSearchUsers error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  adminGetDoctorDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
      const id = req.params.id as string;

      let doctorReferralCode = '';
      let doctorEmail = '';
      let doctorUuid = '';

      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isValidUUID) {
        doctorUuid = id;
        const { data: docUser } = await supabase
          .from('users')
          .select('email, referral_code')
          .eq('id', id)
          .single();

        if (docUser) {
          doctorEmail = docUser.email;
          doctorReferralCode = docUser.referral_code || '';
        }
      } else {
        // If not UUID, it is the doctor's email (unregistered request)
        doctorEmail = id;
        const { data: docUser } = await supabase
          .from('users')
          .select('id, referral_code')
          .eq('email', doctorEmail)
          .maybeSingle();

        if (docUser) {
          doctorUuid = docUser.id;
          doctorReferralCode = docUser.referral_code || '';
        }
      }

      // 1. Fetch referrals
      let referralsQuery = supabase.from('referrals').select('id, patient_name, email, mobile, problem, referral_status, created_at');
      if (doctorUuid) {
        if (doctorReferralCode) {
          referralsQuery = referralsQuery.or(`doctor_id.eq.${doctorUuid},doctor_referral_code.eq.${doctorReferralCode}`);
        } else {
          referralsQuery = referralsQuery.eq('doctor_id', doctorUuid);
        }
      } else if (doctorEmail) {
        // Unregistered doctor: doctor_id is UUID column (querying it by email throws an error). Query by doctor_referral_code instead.
        referralsQuery = referralsQuery.eq('doctor_referral_code', doctorEmail);
      } else {
        referralsQuery = referralsQuery.eq('doctor_id', '00000000-0000-0000-0000-000000000000');
      }
      const { data: mappedReferrals, error: referralsErr } = await referralsQuery.order('created_at', { ascending: false });
      if (referralsErr) throw referralsErr;

      // 2. Fetch mapped patients list
      let patientsQuery = supabase.from('patients').select('id, name, email, phone, age, weight, symptoms, created_at');
      if (doctorUuid) {
        patientsQuery = patientsQuery.or(`referred_by.eq.${doctorUuid},referred_id.eq.${doctorUuid}`);
      } else {
        // Unregistered doctor: referred_by and referred_id are UUID columns. Query by dummy UUID to return empty results safely.
        patientsQuery = patientsQuery.eq('referred_by', '00000000-0000-0000-0000-000000000000');
      }
      const { data: mappedPatients, error: patientsErr } = await patientsQuery.order('created_at', { ascending: false });
      if (patientsErr) throw patientsErr;

      // Translate the snake_case referrals database fields to camelCase expected by the frontend
      const camelCaseReferrals = (mappedReferrals || []).map((r: any) => ({
        id: r.id,
        patientName: r.patient_name,
        email: r.email,
        mobile: r.mobile,
        problem: r.problem,
        referralStatus: r.referral_status,
        created_at: r.created_at
      }));

      res.status(200).json({
        success: true,
        id: doctorUuid || id,
        referralCode: doctorReferralCode || '',
        referralCount: camelCaseReferrals.length,
        convertedCount: mappedPatients ? mappedPatients.length : 0,
        patients: mappedPatients || [],
        referrals: camelCaseReferrals || []
      });
    } catch (error: any) {
      console.error('adminGetDoctorDetails error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };
}