import { DatabaseAdapter, DoctorEarning, CreateDoctorEarningInput } from '../database/interfaces';

export class EarningsRepository {
  constructor(private dbAdapter: DatabaseAdapter) {}

  async getByDoctorId(doctorId: string): Promise<DoctorEarning[]> {
    return this.dbAdapter.getDoctorEarnings(doctorId);
  }

  async create(earning: CreateDoctorEarningInput): Promise<DoctorEarning> {
    return this.dbAdapter.addDoctorEarning(earning);
  }
}
