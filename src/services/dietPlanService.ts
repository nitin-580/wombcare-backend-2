import { DietPlanRepository } from '../repositories/dietPlanRepository';
import { Food, DietPlan, MealLog, WeeklyNutritionReport, PaginatedResult } from '../database/interfaces';
import { logger } from '../utils/logger';

export class DietPlanService {
  constructor(private dietPlanRepository: DietPlanRepository) {}

  async createFood(food: Omit<Food, 'id' | 'createdAt'>): Promise<Food> {
    return this.dietPlanRepository.createFood(food);
  }

  async searchFoods(query: string): Promise<Food[]> {
    return this.dietPlanRepository.searchFoods(query);
  }

  async createDietPlan(plan: Omit<DietPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<DietPlan> {
    logger.info(`Creating diet plan for user ${plan.userId}`);
    return this.dietPlanRepository.createDietPlan(plan);
  }

  async getDietPlanByUserId(userId: string): Promise<DietPlan | null> {
    return this.dietPlanRepository.getDietPlanByUserId(userId);
  }

  async getDietPlanById(id: string): Promise<DietPlan | null> {
    return this.dietPlanRepository.getDietPlanById(id);
  }

  async getPaginatedDietPlans(page: number, limit: number): Promise<PaginatedResult<DietPlan>> {
    return this.dietPlanRepository.getPaginatedDietPlans(page, limit);
  }

  async updateDietPlan(id: string, updates: Partial<DietPlan>): Promise<DietPlan> {
    logger.info(`Updating diet plan ${id}`);
    return this.dietPlanRepository.updateDietPlan(id, updates);
  }

  async deleteDietPlan(id: string): Promise<void> {
    logger.info(`Deleting diet plan ${id}`);
    return this.dietPlanRepository.deleteDietPlan(id);
  }

  async trackMeal(log: {
    userId: string;
    date: string;
    day: number;
    mealIndex: number;
    mealName: string;
    status: 'completed' | 'delayed' | 'skipped';
    completionTime?: string;
  }): Promise<MealLog> {
    const activePlan = await this.dietPlanRepository.getDietPlanByUserId(log.userId);
    if (!activePlan) {
      throw new Error('No active diet plan assigned to this user');
    }

    const totalPlannedMeals = activePlan.dietData.find(d => d.day === log.day)?.meals.length || 0;
    
    // Get existing logs for that date to compute current daily completion
    const existingLogs = await this.dietPlanRepository.getMealLogsByDate(log.userId, log.date);
    const otherLogs = existingLogs.filter(l => l.mealIndex !== log.mealIndex);

    let completedCount = 0;
    if (log.status === 'completed' || log.status === 'delayed') {
      completedCount++;
    }
    for (const other of otherLogs) {
      if (other.status === 'completed' || other.status === 'delayed') {
        completedCount++;
      }
    }

    const dailyCompletionPercentage = totalPlannedMeals > 0 ? Math.round((completedCount / totalPlannedMeals) * 100) : 0;

    // Track/Upsert current meal
    const savedLog = await this.dietPlanRepository.trackMeal({
      userId: log.userId,
      dietPlanId: activePlan.id,
      date: log.date,
      day: log.day,
      mealIndex: log.mealIndex,
      mealName: log.mealName,
      status: log.status,
      completionTime: log.completionTime,
      dailyCompletionPercentage
    });

    // Update other logs for the same day with the new percentage
    for (const other of otherLogs) {
      await this.dietPlanRepository.trackMeal({
        userId: other.userId,
        dietPlanId: other.dietPlanId,
        date: other.date,
        day: other.day,
        mealIndex: other.mealIndex,
        mealName: other.mealName,
        status: other.status,
        completionTime: other.completionTime,
        dailyCompletionPercentage
      });
    }

    logger.info(`Tracked meal for user ${log.userId} on ${log.date}. Status: ${log.status}, Daily Completion: ${dailyCompletionPercentage}%`);
    return savedLog;
  }

  async getWeeklyReport(userId: string, endDateStr?: string): Promise<WeeklyNutritionReport> {
    const activePlan = await this.dietPlanRepository.getDietPlanByUserId(userId);
    const totalPlannedWeekMeals = activePlan 
      ? activePlan.dietData.reduce((sum, d) => sum + (d.meals?.length || 0), 0)
      : 0;

    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);

    const formatOffsetDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const startDateStr = formatOffsetDate(startDate);
    const resolvedEndDateStr = formatOffsetDate(endDate);

    const logs = await this.dietPlanRepository.getMealLogs(userId, startDateStr, resolvedEndDateStr);

    let totalMealsCompleted = 0; // completed + delayed
    let mealsEatenOnTime = 0;    // completed
    let skippedMeals = 0;        // skipped

    for (const log of logs) {
      if (log.status === 'completed') {
        totalMealsCompleted++;
        mealsEatenOnTime++;
      } else if (log.status === 'delayed') {
        totalMealsCompleted++;
      } else if (log.status === 'skipped') {
        skippedMeals++;
      }
    }

    const trackedCount = totalMealsCompleted + skippedMeals;
    const consistencyPercentage = trackedCount > 0 
      ? Math.round((mealsEatenOnTime / trackedCount) * 100)
      : 0;

    const overallDietAdherence = totalPlannedWeekMeals > 0
      ? Math.round((totalMealsCompleted / totalPlannedWeekMeals) * 100)
      : 0;

    return {
      totalMealsCompleted,
      mealsEatenOnTime,
      skippedMeals,
      consistencyPercentage,
      overallDietAdherence
    };
  }

  async getMealLogsHistory(userId: string, startDate: string, endDate: string): Promise<MealLog[]> {
    return this.dietPlanRepository.getMealLogs(userId, startDate, endDate);
  }
}
