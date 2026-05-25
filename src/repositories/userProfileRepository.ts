import { DatabaseAdapter, CreateUserProfileInput, UserProfile } from '../database/interfaces';

export class UserProfileRepository {
  constructor(private dbAdapter: DatabaseAdapter) {}

  async create(profile: CreateUserProfileInput): Promise<UserProfile> {
    return this.dbAdapter.createUserProfile(profile);
  }

  async getById(id: string): Promise<UserProfile> {
    return this.dbAdapter.getUserProfile(id);
  }

  async update(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    return this.dbAdapter.updateUserProfile(id, updates);
  }
}
