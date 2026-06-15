import { DatabaseAdapter, Food, DietPlan, MealLog, PaginatedResult } from '../database/interfaces';

export class DietPlanRepository {
  constructor(private dbAdapter: DatabaseAdapter) {}

  async createFood(food: Omit<Food, 'id' | 'createdAt'>): Promise<Food> {
    return this.dbAdapter.createFood(food);
  }

  async searchFoods(query: string): Promise<Food[]> {
    return this.dbAdapter.searchFoods(query);
  }

  async createDietPlan(plan: Omit<DietPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<DietPlan> {
    return this.dbAdapter.createDietPlan(plan);
  }

  async getDietPlanByUserId(userId: string): Promise<DietPlan | null> {
    return this.dbAdapter.getDietPlanByUserId(userId);
  }

  async getDietPlanById(id: string): Promise<DietPlan | null> {
    return this.dbAdapter.getDietPlanById(id);
  }

  async getPaginatedDietPlans(page: number, limit: number): Promise<PaginatedResult<DietPlan>> {
    return this.dbAdapter.getPaginatedDietPlans(page, limit);
  }

  async updateDietPlan(id: string, updates: Partial<DietPlan>): Promise<DietPlan> {
    return this.dbAdapter.updateDietPlan(id, updates);
  }

  async deleteDietPlan(id: string): Promise<void> {
    return this.dbAdapter.deleteDietPlan(id);
  }

  async trackMeal(log: Omit<MealLog, 'id' | 'createdAt'>): Promise<MealLog> {
    return this.dbAdapter.trackMeal(log);
  }

  async getMealLogs(userId: string, startDate: string, endDate: string): Promise<MealLog[]> {
    return this.dbAdapter.getMealLogs(userId, startDate, endDate);
  }

  async getMealLogsByDate(userId: string, date: string): Promise<MealLog[]> {
    return this.dbAdapter.getMealLogsByDate(userId, date);
  }
}
