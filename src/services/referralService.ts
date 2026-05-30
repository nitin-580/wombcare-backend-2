import bcrypt from 'bcryptjs';
import { ReferralRepository } from '../repositories/referralRepository';
import { DoctorRepository } from '../repositories/doctorRepository';
import { PatientRepository } from '../repositories/patientRepository';
import { UserProfileRepository } from '../repositories/userProfileRepository';
import { Referral, CreateReferralInput, UpdateReferralInput, PaginatedResult } from '../database/interfaces';
import { sendReferralWelcomeMail } from '../lib/sendReferralWelcomeMail';

export class ReferralService {
  constructor(
    private referralRepo: ReferralRepository,
    private doctorRepo: DoctorRepository,
    private patientRepo: PatientRepository,
    private profileRepo: UserProfileRepository
  ) {}

  async createReferral(data: {
    patientName: string;
    mobile: string;
    email: string;
    problem?: string;
    doctorId: string;
  }): Promise<Referral> {
    // 1. Verify doctor exists
    const doctor = await this.doctorRepo.findById(data.doctorId);
    if (!doctor) {
      throw new Error("Doctor not found");
    }

    // 2. Fetch doctor referral code
    const referralCode = doctor.referralCode || '';

    // 3. Create the referral
    const input: CreateReferralInput = {
      patientName: data.patientName,
      mobile: data.mobile,
      email: data.email,
      problem: data.problem || '',
      doctorId: data.doctorId,
      doctorReferralCode: referralCode,
      referralStatus: 'pending',
    };

    return this.referralRepo.create(input);
  }

  async getDoctorReferrals(doctorId: string): Promise<Referral[]> {
    return this.referralRepo.findByDoctor(doctorId);
  }

  async setUserRole(email: string, role: string): Promise<void> {
    await this.doctorRepo.upsertUserRole(email, role);
  }

  async getReferralById(id: string, doctorId: string): Promise<Referral> {
    const referral = await this.referralRepo.findById(id);
    if (!referral) {
      throw new Error("Referral not found");
    }
    if (referral.doctorId !== doctorId) {
      throw new Error("Unauthorized access to this referral");
    }
    return referral;
  }

  async getPaginatedReferrals(options: {
    page: number;
    limit: number;
    status?: string;
    doctorId?: string;
    search?: string;
  }): Promise<PaginatedResult<Referral>> {
    return this.referralRepo.getPaginated(options);
  }

  async updateReferralStatus(id: string, status: Referral['referralStatus']): Promise<Referral> {
    return this.referralRepo.update(id, { referralStatus: status });
  }

  async convertReferralToPatient(referralId: string, customEmail?: string): Promise<{ success: boolean; message: string; referral: Referral }> {
    // 1. Fetch referral
    const referral = await this.referralRepo.findById(referralId);
    if (!referral) {
      throw new Error("Referral not found");
    }

    if (referral.referralStatus === 'converted') {
      throw new Error("Referral is already converted");
    }

    const emailToUse = customEmail || referral.email;
    if (!emailToUse) {
      throw new Error("Email address is required to convert a referral to an active patient account.");
    }

    // Update referral's email in the database so that future queries return the updated email!
    if (customEmail && customEmail !== referral.email) {
      await this.referralRepo.update(referralId, { email: customEmail });
      referral.email = customEmail;
    }

    // 2. Check if a user with this email already exists
    const existingUser = await this.doctorRepo.findByEmail(emailToUse);
    if (existingUser) {
      throw new Error("A user account with this email already exists");
    }

    // 3. Generate a secure random password
    const passwordLength = 10;
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let tempPassword = "";
    for (let i = 0; i < passwordLength; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 4. Create user account in users table
    const newUser = await this.doctorRepo.create({
      name: referral.patientName,
      email: emailToUse,
      password: hashedPassword,
      phone: referral.mobile,
      referralCode: '',
      specialization: '',
      credentials: '',
      profilePicture: '',
    });

    // 5. Assign role 'user' in user_roles table
    await this.doctorRepo.upsertUserRole(newUser.email, 'user');

    // 6. Create patient record referencing referral.id and doctor_id
    const newPatient = await this.patientRepo.create({
      name: referral.patientName,
      email: emailToUse,
      phone: referral.mobile,
      age: 0,
      weight: 0,
      cycleRegularity: 'regular',
      symptoms: referral.problem || '',
      country: 'India',
      referredBy: referral.doctorId,
      referredId: referral.id,
    });

    // 7. Initialize user profile
    await this.profileRepo.create({
      id: newUser.id,
      name: referral.patientName,
      email: emailToUse,
      profileCompleted: false,
    });

    // 8. Update referral status to converted and save convertedPatientId
    const updatedReferral = await this.referralRepo.update(referralId, {
      referralStatus: 'converted',
      convertedPatientId: newUser.id,
    });

    // 9. Send onboarding credentials email
    await sendReferralWelcomeMail(emailToUse, referral.patientName, tempPassword).catch(err => {
      console.error("Failed to send referral onboarding email:", err);
    });

    return {
      success: true,
      message: "Referral converted successfully",
      referral: updatedReferral,
    };
  }

  // Doctor access to patient history for converted referrals
  async getReferralPatientHistory(referredId: string, doctorId: string): Promise<{ patient: any; profile: any; periodHistory: any[]; wellnessHistory: any[] }> {
    // Verify the referral exists and belongs to this doctor
    const referral = await this.referralRepo.findById(referredId);
    if (!referral) {
      throw new Error("Referral not found");
    }
    if (referral.doctorId !== doctorId) {
      throw new Error("Unauthorized: This referral does not belong to you");
    }
    if (referral.referralStatus !== 'converted' || !referral.convertedPatientId) {
      throw new Error("Referral has not been converted to an active patient yet");
    }

    // Find the patient record under this doctor that matches this referral id
    const patients = await this.patientRepo.findByDoctor(doctorId);
    const patient = patients.find(p => p.referredId === referredId);
    if (!patient) {
      throw new Error("Patient record not found associated with this referral");
    }

    // Fetch patient profile, period history and wellness history
    const profile = await this.profileRepo.getById(referral.convertedPatientId).catch(() => null);
    const periodHistory = await this.profileRepo.getPeriodHistory(referral.convertedPatientId).catch(() => []);
    const wellnessHistory = await this.profileRepo.getHistory(referral.convertedPatientId).catch(() => []);

    return {
      patient,
      profile,
      periodHistory,
      wellnessHistory
    };
  }
}
