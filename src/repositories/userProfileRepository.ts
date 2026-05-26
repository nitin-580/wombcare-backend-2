import { DatabaseAdapter, CreateUserProfileInput, UserProfile, UserProfileHistory, CreateUserProfileHistoryInput } from '../database/interfaces';

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

  async saveHistory(history: CreateUserProfileHistoryInput): Promise<UserProfileHistory> {
    return this.dbAdapter.saveUserProfileHistory(history);
  }

  async getHistory(userId: string): Promise<UserProfileHistory[]> {
    return this.dbAdapter.getUserProfileHistory(userId);
  }
}
