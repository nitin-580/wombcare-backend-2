import { DatabaseAdapter, Blog, CreateBlogInput, UpdateBlogInput, PaginatedResult } from '../database/interfaces';

export class BlogRepository {
  constructor(private db: DatabaseAdapter) {}

  async create(blog: CreateBlogInput): Promise<Blog> {
    return this.db.createBlog(blog);
  }

  async getById(id: string): Promise<Blog | null> {
    return this.db.getBlogById(id);
  }

  async getBySlug(slug: string): Promise<Blog | null> {
    return this.db.getBlogBySlug(slug);
  }

  async getPaginated(page: number, limit: number): Promise<PaginatedResult<Blog>> {
    return this.db.getPaginatedBlogs(page, limit);
  }

  async update(id: string, blog: UpdateBlogInput): Promise<Blog> {
    return this.db.updateBlog(id, blog);
  }

  async delete(id: string): Promise<void> {
    return this.db.deleteBlog(id);
  }
}
