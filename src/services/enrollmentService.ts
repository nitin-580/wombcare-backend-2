import { EnrollmentRepository } from '../repositories/enrollmentRepository';
import { CreateEnrollmentInput } from '../database/interfaces';
import { logger } from '../utils/logger';

export class EnrollmentService {
  constructor(private enrollmentRepository: EnrollmentRepository) {}

  async enroll(enrollmentData: CreateEnrollmentInput) {
    // Persist enrollment to database
    const enrollment = await this.enrollmentRepository.create(enrollmentData);

    logger.info(`New enrollment created for: ${enrollment.fullName}`);

    return enrollment;
  }

  async getEnrollments(page: number, limit: number) {
    return this.enrollmentRepository.getPaginatedEnrollments(page, limit);
  }
}
