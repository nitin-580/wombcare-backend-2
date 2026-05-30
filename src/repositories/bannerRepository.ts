import { DatabaseAdapter, Banner, CreateBannerInput, UpdateBannerInput, PaginatedResult } from '../database/interfaces';

export class BannerRepository {
  constructor(private db: DatabaseAdapter) {}

  async create(banner: CreateBannerInput): Promise<Banner> {
    return this.db.createBanner(banner);
  }

  async getById(id: string): Promise<Banner | null> {
    return this.db.getBannerById(id);
  }

  async getPaginated(page: number, limit: number): Promise<PaginatedResult<Banner>> {
    return this.db.getPaginatedBanners(page, limit);
  }

  async getActive(): Promise<Banner[]> {
    return this.db.getActiveBanners();
  }

  async update(id: string, banner: UpdateBannerInput): Promise<Banner> {
    return this.db.updateBanner(id, banner);
  }

  async delete(id: string): Promise<void> {
    return this.db.deleteBanner(id);
  }
}
