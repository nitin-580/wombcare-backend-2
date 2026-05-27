import { UserProfileRepository } from '../repositories/userProfileRepository';
import { CreateUserProfileInput, UserProfile, UserProfileHistory } from '../database/interfaces';
import { logger } from '../utils/logger';
import { sendWelcomeMail } from '../lib/sendWelcomeMail';

export class UserProfileService {
  constructor(private userProfileRepository: UserProfileRepository) { }

  async createProfile(profileData: CreateUserProfileInput): Promise<UserProfile> {
    const profile = await this.userProfileRepository.create(profileData);

    // If period tracker is enabled during onboarding, seed the first period history cycle
    if (profile.isPeriodTrackerEnabled && profile.cycleStartDate) {
      try {
        const startDateStr = profile.cycleStartDate.split('T')[0];
        const startDate = new Date(startDateStr);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 4); // 5-day duration
        const endDateStr = endDate.toISOString().split('T')[0];

        await this.userProfileRepository.savePeriodHistory({
          userId: profile.id,
          startDate: startDateStr,
          endDate: endDateStr,
          symptoms: [],
          notes: "Onboarding cycle initialized"
        });
        logger.info(`[ONBOARDING] Initial period cycle seeded in wombcare_period_history for user: ${profile.name}`);
      } catch (err) {
        logger.error(`[ONBOARDING] Failed to seed initial period cycle for user ${profile.id}:`, err);
      }
    }

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

    // Fetch the latest period cycle from dedicated wombcare_period_history table to synchronize cycleDay and cycleStartDate
    let syncedCycleDay = profile.cycleDay || 1;
    let latestPeriodStartDateStr = profile.cycleStartDate;

    try {
      const periodHistory = await this.userProfileRepository.getPeriodHistory(profile.id);
      if (periodHistory && periodHistory.length > 0) {
        const latestPeriod = periodHistory[0]; // sorted by start_date descending (latest first)
        if (latestPeriod && latestPeriod.startDate) {
          const cleanStartDateStr = latestPeriod.startDate.split('T')[0];
          
          // Calculate correct cycle day based on the start date
          const start = new Date(cleanStartDateStr);
          const todayDate = new Date(todayStr);
          const diffTime = todayDate.getTime() - start.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          
          const cycleLength = profile.cycleLength || 28;
          if (diffDays >= 0) {
            syncedCycleDay = (diffDays % cycleLength) + 1;
            latestPeriodStartDateStr = cleanStartDateStr;
          }
        }
      }
    } catch (err) {
      logger.error(`[SYNC PERIOD] Failed to sync cycle parameters for user ${profile.id}:`, err);
    }

    // Check what the last seen date was
    const lastSeenStr = profile.lastSeen ? new Date(profile.lastSeen).toISOString().split('T')[0] : null;

    // If lastSeen doesn't exist or matches today, check if profile cycle day/start date is out of sync and update
    if (!lastSeenStr || lastSeenStr === todayStr) {
      const needsSync = profile.cycleDay !== syncedCycleDay || profile.cycleStartDate !== latestPeriodStartDateStr;
      if (needsSync || !profile.lastSeen || new Date(profile.lastSeen).getTime() < today.getTime() - 60000) {
        return this.userProfileRepository.update(profile.id, { 
          lastSeen: today.toISOString(),
          cycleDay: syncedCycleDay,
          cycleStartDate: latestPeriodStartDateStr
        });
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

      // Calculate cycle day active during lastSeen
      let lastSeenCycleDay = profile.cycleDay || 1;
      if (latestPeriodStartDateStr) {
        const start = new Date(latestPeriodStartDateStr);
        const diffTimeLastSeen = lastSeenDate.getTime() - start.getTime();
        const diffDaysLastSeen = Math.round(diffTimeLastSeen / (1000 * 60 * 60 * 24));
        if (diffDaysLastSeen >= 0) {
          lastSeenCycleDay = (diffDaysLastSeen % (profile.cycleLength || 28)) + 1;
        }
      }

      // 1. Save history for the last active day
      await this.userProfileRepository.saveHistory({
        userId: profile.id,
        date: lastSeenStr,
        waterIntake: profile.waterIntake || 0,
        mood: profile.mood,
        sleep: profile.sleep || 0,
        cycleDay: lastSeenCycleDay,
        symptoms: profile.symptoms || [],
        journal: profile.journal
      }).catch(err => {
        logger.error(`[DAILY RESET] Failed to save history for user ${profile.id}:`, err);
      });

      // 2. Prepare updates and reset for the new day
      const profileUpdates: Partial<UserProfile> = {
        waterIntake: 0,
        mood: null as any, // Reset mood
        sleep: 0, // Reset sleep
        journal: null as any, // Reset journal
        waterIntakeDate: todayStr,
        moodDate: todayStr,
        lastSeen: today.toISOString(),
        cycleDay: syncedCycleDay,
        cycleStartDate: latestPeriodStartDateStr
      };

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

      // Check if today's entry already exists in the fetched history array
      const todayIndex = history.findIndex(item => item.date === todayStr);

      const todayEntry: UserProfileHistory = {
        id: `today-${profile.id}`,
        userId: profile.id,
        date: todayStr,
        waterIntake: profile.waterIntake || 0,
        mood: profile.mood || '',
        sleep: profile.sleep || 0,
        cycleDay: profile.cycleDay || 0,
        symptoms: profile.symptoms || [],
        createdAt: new Date().toISOString(),
        journal: profile.journal || ''
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

  async startPeriod(id: string, startDateStr?: string): Promise<UserProfile> {
    const profile = await this.userProfileRepository.getById(id);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const activeStartDateStr = startDateStr || todayStr;
    const activeStartDate = new Date(activeStartDateStr);
    
    // 5-day standard period duration
    const activeEndDate = new Date(activeStartDate);
    activeEndDate.setDate(activeEndDate.getDate() + 4);
    const activeEndDateStr = activeEndDate.toISOString().split('T')[0];

    // Log the period start in dedicated wombcare_period_history table, avoiding duplicates
    try {
      const periodHistory = await this.userProfileRepository.getPeriodHistory(id);
      const latestPeriod = periodHistory[0]; // sorted by start_date descending (latest first)

      let isSameCycleUpdate = false;
      if (latestPeriod) {
        const latestStart = new Date(latestPeriod.startDate);
        const newStart = new Date(activeStartDateStr);
        const diffTime = Math.abs(newStart.getTime() - latestStart.getTime());
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 15) {
          isSameCycleUpdate = true;
        }
      }

      if (isSameCycleUpdate && latestPeriod) {
        await this.userProfileRepository.updatePeriodHistory(latestPeriod.id, {
          startDate: activeStartDateStr,
          endDate: activeEndDateStr,
          notes: "Logged period start (updated start date)"
        });
        logger.info(`[START PERIOD] Entry is within the active cycle window. Updated existing record ${latestPeriod.id} instead of creating duplicate.`);
      } else {
        await this.userProfileRepository.savePeriodHistory({
          userId: id,
          startDate: activeStartDateStr,
          endDate: activeEndDateStr,
          symptoms: [],
          notes: "Logged period start"
        });
      }
    } catch (err) {
      logger.error(`[START PERIOD] Failed to log period entry in wombcare_period_history for user ${id}:`, err);
    }

    const cycleLength = profile.cycleLength || 28;
    
    // Day difference between today and activeStartDate
    const diffTime = new Date(todayStr).getTime() - activeStartDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    // Compute current cycleDay today (1-based index)
    const currentCycleDay = diffDays >= 0 ? (diffDays % cycleLength) + 1 : 1;

    // Calculate the next period date (activeStartDate + cycleLength)
    const nextPeriodDate = new Date(activeStartDate);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);
    const nextPeriodDateStr = nextPeriodDate.toISOString().split('T')[0];

    const updatedProfile = await this.userProfileRepository.update(id, {
      cycleDay: currentCycleDay,
      cycleStartDate: activeStartDateStr,
      lastSeen: today.toISOString(),
      symptoms: [], // Don't write 'Period' in current user profile symptoms list
      nextPeriodDate: nextPeriodDateStr
    });

    logger.info(`[START PERIOD] Period cycle logged/reset for user ${profile.name} (ID: ${id}) starting from ${activeStartDateStr}. Current cycleDay: ${currentCycleDay}`);
    return updatedProfile;
  }

  async endPeriod(id: string, endDateStr?: string): Promise<UserProfile> {
    const profile = await this.userProfileRepository.getById(id);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const activeEndDateStr = endDateStr || todayStr;

    try {
      const periodHistory = await this.userProfileRepository.getPeriodHistory(id);
      if (periodHistory && periodHistory.length > 0) {
        const latestPeriod = periodHistory[0]; // sorted by start_date descending (latest first)
        const startDateOfLatest = new Date(latestPeriod.startDate);
        const endDateOfCurrent = new Date(activeEndDateStr);
        const diffTime = endDateOfCurrent.getTime() - startDateOfLatest.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 10) {
          // Safe active cycle update
          await this.userProfileRepository.updatePeriodHistory(latestPeriod.id, {
            endDate: activeEndDateStr,
            notes: latestPeriod.notes ? `${latestPeriod.notes} (End date updated)` : "Logged period end"
          });
          logger.info(`[END PERIOD] Updated end_date for active cycle ${latestPeriod.id} to ${activeEndDateStr}`);
        } else {
          // The latest cycle is in the past. Create a new cycle for this month to avoid history corruption!
          const defaultStartDate = new Date(endDateOfCurrent);
          defaultStartDate.setDate(defaultStartDate.getDate() - 4);
          const defaultStartDateStr = defaultStartDate.toISOString().split('T')[0];

          await this.userProfileRepository.savePeriodHistory({
            userId: id,
            startDate: defaultStartDateStr,
            endDate: activeEndDateStr,
            symptoms: [],
            notes: "Logged period end (new active cycle created)"
          });
          logger.info(`[END PERIOD] Past history protected. Created brand new active cycle starting ${defaultStartDateStr} and ending ${activeEndDateStr}`);
        }
      } else {
        // No records in history yet. Create a standard new cycle starting 4 days ago.
        const endDateOfCurrent = new Date(activeEndDateStr);
        const defaultStartDate = new Date(endDateOfCurrent);
        defaultStartDate.setDate(defaultStartDate.getDate() - 4);
        const defaultStartDateStr = defaultStartDate.toISOString().split('T')[0];

        await this.userProfileRepository.savePeriodHistory({
          userId: id,
          startDate: defaultStartDateStr,
          endDate: activeEndDateStr,
          symptoms: [],
          notes: "Logged period end"
        });
        logger.info(`[END PERIOD] No previous history. Created first cycle entry starting ${defaultStartDateStr}`);
      }
    } catch (err) {
      logger.error(`[END PERIOD] Failed to update period end entry for user ${id}:`, err);
    }

    return await this.userProfileRepository.getById(id);
  }

  async getPeriodHistory(userId: string): Promise<any[]> {
    return this.userProfileRepository.getPeriodHistory(userId);
  }

  async updatePeriodHistoryRecord(userId: string, periodId: string, updates: { startDate?: string; endDate?: string; symptoms?: string[]; notes?: string }): Promise<any> {
    const history = await this.userProfileRepository.getPeriodHistory(userId);
    const record = history.find(p => p.id === periodId);
    if (!record) {
      throw new Error(`Period history record ${periodId} not found for user ${userId}`);
    }

    const updated = await this.userProfileRepository.updatePeriodHistory(periodId, updates);

    // Synchronize active user profile if the updated record is the current active period start
    const profile = await this.userProfileRepository.getById(userId);
    if (profile.cycleStartDate === record.startDate || updates.startDate) {
      const todayStr = new Date().toISOString().split('T')[0];
      const activeStartDateStr = updates.startDate || record.startDate;
      const activeStartDate = new Date(activeStartDateStr);
      const cycleLength = profile.cycleLength || 28;

      const diffTime = new Date(todayStr).getTime() - activeStartDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      const currentCycleDay = diffDays >= 0 ? (diffDays % cycleLength) + 1 : 1;

      const nextPeriodDate = new Date(activeStartDate);
      nextPeriodDate.setDate(nextPeriodDate.getDate() + cycleLength);
      const nextPeriodDateStr = nextPeriodDate.toISOString().split('T')[0];

      await this.userProfileRepository.update(userId, {
        cycleStartDate: activeStartDateStr,
        cycleDay: currentCycleDay,
        nextPeriodDate: nextPeriodDateStr
      });
    }

    return updated;
  }
}
