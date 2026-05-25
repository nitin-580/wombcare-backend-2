import { UserRepository } from '../repositories/userRepository';
import { EnrollmentRepository } from '../repositories/enrollmentRepository';

export class AdminService {
  constructor(
    private userRepository: UserRepository,
    private enrollmentRepository: EnrollmentRepository
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
}
