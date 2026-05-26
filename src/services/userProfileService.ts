import { UserProfileRepository } from '../repositories/userProfileRepository';
import { CreateUserProfileInput, UserProfile, UserProfileHistory } from '../database/interfaces';
import { logger } from '../utils/logger';
import { sendWelcomeMail } from '../lib/sendWelcomeMail';

export class UserProfileService {
  constructor(private userProfileRepository: UserProfileRepository) { }

  async createProfile(profileData: CreateUserProfileInput): Promise<UserProfile> {
    const profile = await this.userProfileRepository.create(profileData);

    // Send welcome email
    sendWelcomeMail(profile.email, profile.name).catch(err => {
      logger.error(`Failed to send welcome email to ${profile.email}:`, err);
    });

    logger.info(`User profile created for: ${profile.name} (${profile.email})`);
    return profile;
  }

  async getProfile(id: string): Promise<UserProfile> {
    const profile = await this.userProfileRepository.getById(id);
    return this.handleDailyResetAndCycleAdvancement(profile);
  }

  async updateProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    // 1. Retrieve the existing profile from the repository first
    let profile = await this.userProfileRepository.getById(id);

    // 2. Perform daily reset check/cycle advancement BEFORE applying updates.
    // If the date changed, this will archive yesterday's old parameters into history,
    // reset today's active parameters to clean defaults, and return the clean profile.
    profile = await this.handleDailyResetAndCycleAdvancement(profile);

    // 3. Apply today's new updates on top of the correct, reset profile
    const updatedProfile = await this.userProfileRepository.update(id, updates);
    logger.info(`User profile updated for: ${updatedProfile.name} (ID: ${id})`);

    return updatedProfile;
  }

  private async handleDailyResetAndCycleAdvancement(profile: UserProfile): Promise<UserProfile> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // "YYYY-MM-DD"

    // Check what the last seen date was
    const lastSeenStr = profile.lastSeen ? new Date(profile.lastSeen).toISOString().split('T')[0] : null;

    // If lastSeen doesn't exist or matches today, just update lastSeen to now and return
    if (!lastSeenStr || lastSeenStr === todayStr) {
      if (!profile.lastSeen || new Date(profile.lastSeen).getTime() < today.getTime() - 60000) {
        return this.userProfileRepository.update(profile.id, { lastSeen: today.toISOString() });
      }
      return profile;
    }

    logger.info(`[DAILY RESET] Day changed for user ${profile.name} (${profile.id}). Last seen: ${lastSeenStr}, Today: ${todayStr}`);

    try {
      // Calculate number of days passed since last active day
      const lastSeenDate = new Date(lastSeenStr);
      const todayDate = new Date(todayStr);
      const diffTime = Math.abs(todayDate.getTime() - lastSeenDate.getTime());
      const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

      // Parse sleep hours from symptoms array if present (formatted as "Sleep: X")
      let sleepHours = 0;
      const symptoms = Array.isArray(profile.symptoms) ? profile.symptoms : [];
      const sleepSymptom = symptoms.find(s => typeof s === 'string' && s.startsWith('Sleep:'));
      if (sleepSymptom) {
        const parsed = parseInt(sleepSymptom.replace('Sleep:', '').trim(), 10);
        if (!isNaN(parsed)) {
          sleepHours = parsed;
        }
      }

      // 1. Save history for the last active day
      await this.userProfileRepository.saveHistory({
        userId: profile.id,
        date: lastSeenStr,
        waterIntake: profile.waterIntake || 0,
        mood: profile.mood,
        sleep: sleepHours,
        cycleDay: profile.cycleDay,
        symptoms: profile.symptoms || []
      }).catch(err => {
        logger.error(`[DAILY RESET] Failed to save history for user ${profile.id}:`, err);
      });

      // 2. Prepare updates
      const profileUpdates: Partial<UserProfile> = {
        waterIntake: 0,
        mood: null as any, // Reset mood
        waterIntakeDate: todayStr,
        moodDate: todayStr,
        lastSeen: today.toISOString()
      };

      // 3. Increment period cycleDay if period tracker is enabled
      if (profile.isPeriodTrackerEnabled && profile.cycleDay && profile.cycleLength) {
        let newCycleDay = profile.cycleDay + diffDays;
        if (newCycleDay > profile.cycleLength) {
          newCycleDay = ((newCycleDay - 1) % profile.cycleLength) + 1;
        }
        profileUpdates.cycleDay = newCycleDay;
        logger.info(`[DAILY RESET] Updated cycle day for user ${profile.id} from ${profile.cycleDay} to ${newCycleDay} (days passed: ${diffDays})`);
      }

      // Apply the updates to database and return the refreshed profile
      return await this.userProfileRepository.update(profile.id, profileUpdates);
    } catch (err) {
      logger.error(`[DAILY RESET] Error during daily reset process for user ${profile.id}:`, err);
      return profile;
    }
  }

  async getProfileHistory(userId: string): Promise<UserProfileHistory[]> {
    const history = await this.userProfileRepository.getHistory(userId);

    // Dynamically build today's active parameters from user profile and merge/prepend
    try {
      const profile = await this.userProfileRepository.getById(userId);
      const todayStr = new Date().toISOString().split('T')[0];

      // Parse sleep hours from symptoms array if present (formatted as "Sleep: X")
      let sleepHours = 0;
      const symptoms = Array.isArray(profile.symptoms) ? profile.symptoms : [];
      const sleepSymptom = symptoms.find(s => typeof s === 'string' && s.startsWith('Sleep:'));
      if (sleepSymptom) {
        const parsed = parseInt(sleepSymptom.replace('Sleep:', '').trim(), 10);
        if (!isNaN(parsed)) {
          sleepHours = parsed;
        }
      }

      // Check if today's entry already exists in the fetched history array
      const todayIndex = history.findIndex(item => item.date === todayStr);

      const todayEntry: UserProfileHistory = {
        id: `today-${profile.id}`,
        userId: profile.id,
        date: todayStr,
        waterIntake: profile.waterIntake || 0,
        mood: profile.mood || '',
        sleep: sleepHours,
        cycleDay: profile.cycleDay || 0,
        symptoms: profile.symptoms || [],
        createdAt: new Date().toISOString()
      };

      if (todayIndex > -1) {
        // Replace with current live parameters
        history[todayIndex] = todayEntry;
      } else {
        // Prepend today's live parameters to history
        history.unshift(todayEntry);
      }
    } catch (err) {
      logger.error(`[GET PROFILE HISTORY] Failed to append today's dynamic record:`, err);
    }

    return history;
  }

  async startPeriod(id: string): Promise<UserProfile> {
    const profile = await this.userProfileRepository.getById(id);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Log the period start in history table
    try {
      await this.userProfileRepository.saveHistory({
        userId: id,
        date: todayStr,
        cycleDay: 1,
        mood: profile.mood,
        waterIntake: profile.waterIntake || 0,
        sleep: 0,
        symptoms: ["Period"]
      });
    } catch (err) {
      logger.error(`[START PERIOD] Failed to log start of period history entry for user ${id}:`, err);
    }

    const cycleLength = profile.cycleLength || 28;
    const nextPeriodDate = new Date();
    nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);
    const nextPeriodDateStr = nextPeriodDate.toISOString().split('T')[0];

    const updatedProfile = await this.userProfileRepository.update(id, {
      cycleDay: 1,
      lastSeen: today.toISOString(),
      symptoms: ["Period"],
      nextPeriodDate: nextPeriodDateStr
    });

    logger.info(`[START PERIOD] Period cycle logged/reset for user ${profile.name} (ID: ${id})`);
    return updatedProfile;
  }
}
