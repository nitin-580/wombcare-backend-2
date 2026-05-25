import { CareerRepository } from '../repositories/careerRepository';
import { CreateCareerInput, UpdateCareerInput, Career, PaginatedResult } from '../database/interfaces';

export class CareerService {
  constructor(private careerRepository: CareerRepository) {}

  async createCareer(career: CreateCareerInput): Promise<Career> {
    if (!career.title || !career.department || !career.description) {
      throw new Error('Title, department, and description are required');
    }
    return this.careerRepository.create({
      ...career,
      active: career.active !== undefined ? career.active : true
    });
  }

  async getCareerById(id: string): Promise<Career> {
    const career = await this.careerRepository.findById(id);
    if (!career) {
      throw new Error('Career not found');
    }
    return career;
  }

  async getCareers(page: number, limit: number): Promise<PaginatedResult<Career>> {
    return this.careerRepository.findAll(page, limit);
  }

  async updateCareer(id: string, career: UpdateCareerInput): Promise<Career> {
    return this.careerRepository.update(id, career);
  }

  async deleteCareer(id: string): Promise<void> {
    return this.careerRepository.delete(id);
  }
}
