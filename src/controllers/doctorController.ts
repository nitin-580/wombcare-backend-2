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
}