import { 
  DatabaseAdapter, 
  Referral, 
  CreateReferralInput, 
  UpdateReferralInput, 
  PaginatedResult 
} from '../database/interfaces';

export class ReferralRepository {
  constructor(private dbAdapter: DatabaseAdapter) {}

  async create(referral: CreateReferralInput): Promise<Referral> {
    return this.dbAdapter.createReferral(referral);
  }

  async findById(id: string): Promise<Referral | null> {
    return this.dbAdapter.getReferralById(id);
  }

  async findByDoctor(doctorId: string): Promise<Referral[]> {
    return this.dbAdapter.getReferralsByDoctor(doctorId);
  }

  async getPaginated(options: { 
    page: number; 
    limit: number; 
    status?: string; 
    doctorId?: string; 
    search?: string; 
  }): Promise<PaginatedResult<Referral>> {
    return this.dbAdapter.getPaginatedReferrals(options);
  }

  async update(id: string, updates: UpdateReferralInput): Promise<Referral> {
    return this.dbAdapter.updateReferral(id, updates);
  }
}
