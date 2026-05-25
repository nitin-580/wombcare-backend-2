import { DatabaseAdapter, CreateEnrollmentInput, Enrollment, PaginatedResult } from '../database/interfaces';

export class EnrollmentRepository {
  constructor(private dbAdapter: DatabaseAdapter) {}

  async create(enrollment: CreateEnrollmentInput): Promise<Enrollment> {
    return this.dbAdapter.createEnrollment(enrollment);
  }

  async getPaginatedEnrollments(page: number, limit: number): Promise<PaginatedResult<Enrollment>> {
    return this.dbAdapter.getPaginatedEnrollments(page, limit);
  }

  async getStats(): Promise<{ total: number }> {
    return this.dbAdapter.getEnrollmentStats();
  }
}
