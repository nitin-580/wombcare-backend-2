import { UserRepository } from '../repositories/userRepository';
import { CreateUserInput } from '../database/interfaces';
import { sendWelcomeMail } from '../lib/sendWelcomeMail';
import { logger } from '../utils/logger';

export class EarlyAccessService {
  constructor(private userRepository: UserRepository) {}

  async registerUser(userData: CreateUserInput) {
    // 1. Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      const error = new Error('Email is already registered for early access');
      (error as any).status = 409; // Conflict
      throw error;
    }

    // 2. Persist user to database
    const user = await this.userRepository.create(userData);

    // 2.5 Sync to user_roles as 'user'
    await this.userRepository.upsertUserRole(user.email, 'user').catch((err) => {
      logger.error(`Failed to sync role for ${user.email}:`, err);
    });

    // 3. Trigger welcome email using Resend utility
    sendWelcomeMail(user.email, user.name).catch((err) => {
      logger.error(`Failed to send welcome email to ${user.email}:`, err);
    });

    return user;
  }
}
