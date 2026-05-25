import { DatabaseAdapter, CreateUserInput, User, RegistrationStats, PaginatedResult } from '../database/interfaces';

export class UserRepository {
  constructor(private dbAdapter: DatabaseAdapter) {}

  async create(user: CreateUserInput): Promise<User> {
    return this.dbAdapter.createUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.dbAdapter.getUserByEmail(email);
  }

  async getRegistrationStats(): Promise<RegistrationStats> {
    return this.dbAdapter.getRegistrationStats();
  }

  async getPaginatedUsers(page: number, limit: number): Promise<PaginatedResult<User>> {
    return this.dbAdapter.getPaginatedUsers(page, limit);
  }

  async upsertUserRole(email: string, role: string): Promise<void> {
    return this.dbAdapter.upsertUserRole(email, role);
  }
}
