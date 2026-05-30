import { UserRepository } from '../repositories/userRepository';
import { EnrollmentRepository } from '../repositories/enrollmentRepository';
import { PatientRepository } from '../repositories/patientRepository';

export class AdminService {
  constructor(
    private userRepository: UserRepository,
    private enrollmentRepository: EnrollmentRepository,
    private patientRepository: PatientRepository
  ) {}

  async getStats() {
    const [userStats, enrollmentStats] = await Promise.all([
      this.userRepository.getRegistrationStats(),
      this.enrollmentRepository.getStats()
    ]);

    return {
      ...userStats,
      enrollments: enrollmentStats.total
    };
  }

  async getUsers(page: number, limit: number) {
    return this.userRepository.getPaginatedUsers(page, limit);
  }

  async getPatients(page: number, limit: number) {
    return this.patientRepository.getPaginated(page, limit);
  }
}
