import { BannerRepository } from '../repositories/bannerRepository';
import { CreateBannerInput, UpdateBannerInput } from '../database/interfaces';

export class BannerService {
  constructor(private bannerRepository: BannerRepository) {}

  async createBanner(banner: CreateBannerInput) {
    return this.bannerRepository.create(banner);
  }

  async getBanner(id: string) {
    const banner = await this.bannerRepository.getById(id);
    if (!banner) {
      throw new Error(`Banner with ID ${id} not found`);
    }
    return banner;
  }

  async getPaginatedBanners(page: number, limit: number) {
    return this.bannerRepository.getPaginated(page, limit);
  }

  async getActiveBanners() {
    return this.bannerRepository.getActive();
  }

  async updateBanner(id: string, updates: UpdateBannerInput) {
    // Check if it exists
    await this.getBanner(id);
    return this.bannerRepository.update(id, updates);
  }

  async deleteBanner(id: string) {
    // Check if it exists
    await this.getBanner(id);
    return this.bannerRepository.delete(id);
  }
}
