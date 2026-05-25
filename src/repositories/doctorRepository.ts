import { 
  DatabaseAdapter, 
  Doctor, 
  CreateDoctorInput, 
  UpdateDoctorInput, 
  PaginatedResult,
  DoctorJoinRequest,
  CreateDoctorJoinRequestInput
} from '../database/interfaces';

export class DoctorRepository {
  constructor(private dbAdapter: DatabaseAdapter) {}

  async create(doctor: CreateDoctorInput): Promise<Doctor> {
    return this.dbAdapter.createDoctor(doctor);
  }

  async findById(id: string): Promise<Doctor | null> {
    return this.dbAdapter.getDoctorById(id);
  }

  async findByEmail(email: string): Promise<Doctor | null> {
    return this.dbAdapter.getDoctorByEmail(email);
  }

  async findByReferralCode(code: string): Promise<Doctor | null> {
    return this.dbAdapter.getDoctorByReferralCode(code);
  }

  async update(id: string, doctor: UpdateDoctorInput): Promise<Doctor> {
    return this.dbAdapter.updateDoctor(id, doctor);
  }

  async getPaginated(page: number, limit: number): Promise<PaginatedResult<Doctor>> {
    return this.dbAdapter.getPaginatedDoctors(page, limit);
  }

  async getUserRole(email: string): Promise<string | null> {
    return this.dbAdapter.getUserRole(email);
  }

  async createJoinRequest(request: CreateDoctorJoinRequestInput): Promise<DoctorJoinRequest> {
    return this.dbAdapter.createDoctorJoinRequest(request);
  }

  async getJoinRequests(): Promise<DoctorJoinRequest[]> {
    return this.dbAdapter.getDoctorJoinRequests();
  }

  async updateJoinRequestStatus(id: string, status: 'approved' | 'rejected'): Promise<DoctorJoinRequest> {
    return this.dbAdapter.updateDoctorJoinRequestStatus(id, status);
  }

  async saveOtp(email: string, otp: string, expiresAt: Date): Promise<void> {
    return this.dbAdapter.saveOtp(email, otp, expiresAt);
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    return this.dbAdapter.verifyOtp(email, otp);
  }

  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    return this.dbAdapter.updatePassword(email, hashedPassword);
  }

  async upsertUserRole(email: string, role: string): Promise<void> {
    return this.dbAdapter.upsertUserRole(email, role);
  }
}
