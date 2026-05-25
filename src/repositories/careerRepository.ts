import { DatabaseAdapter, Career, CreateCareerInput, UpdateCareerInput, PaginatedResult } from '../database/interfaces';

export class CareerRepository {
  constructor(private db: DatabaseAdapter) {}

  async create(career: CreateCareerInput): Promise<Career> {
    return this.db.createCareer(career);
  }

  async findById(id: string): Promise<Career | null> {
    return this.db.getCareerById(id);
  }

  async findAll(page: number, limit: number): Promise<PaginatedResult<Career>> {
    return this.db.getPaginatedCareers(page, limit);
  }

  async update(id: string, career: UpdateCareerInput): Promise<Career> {
    return this.db.updateCareer(id, career);
  }

  async delete(id: string): Promise<void> {
    return this.db.deleteCareer(id);
  }
}
