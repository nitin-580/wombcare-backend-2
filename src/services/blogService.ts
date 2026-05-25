import { BlogRepository } from '../repositories/blogRepository';
import { CreateBlogInput, UpdateBlogInput, Blog, PaginatedResult } from '../database/interfaces';
import { slugify } from '../utils/slugify';

export class BlogService {
  constructor(private blogRepository: BlogRepository) {}

  async createBlog(blog: CreateBlogInput): Promise<Blog> {
    if (!blog.title || !blog.content || !blog.authorName) {
      throw new Error('Title, content, and author name are required');
    }
    
    // Generate unique slug
    let slug = slugify(blog.title);
    let isUnique = false;
    let finalSlug = slug;
    let counter = 1;

    while (!isUnique) {
      const existing = await this.blogRepository.getBySlug(finalSlug);
      if (!existing) {
        isUnique = true;
      } else {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }
    }
    
    // Default to HTML if not specified
    const blogData = {
      ...blog,
      slug: finalSlug,
      contentType: blog.contentType || 'html',
      published: blog.published !== undefined ? blog.published : true
    };

    return this.blogRepository.create(blogData);
  }

  async getBlogById(id: string): Promise<Blog> {
    const blog = await this.blogRepository.getById(id);
    if (!blog) {
      throw new Error('Blog not found');
    }
    return blog;
  }

  async getBlogBySlug(slug: string): Promise<Blog> {
    const blog = await this.blogRepository.getBySlug(slug);
    if (!blog) {
      throw new Error('Blog not found');
    }
    return blog;
  }

  async getBlogs(page: number = 1, limit: number = 10): Promise<PaginatedResult<Blog>> {
    return this.blogRepository.getPaginated(page, limit);
  }

  async updateBlog(id: string, blog: UpdateBlogInput): Promise<Blog> {
    const existing = await this.blogRepository.getById(id);
    if (!existing) {
      throw new Error('Blog not found');
    }
    return this.blogRepository.update(id, blog);
  }

  async deleteBlog(id: string): Promise<void> {
    const existing = await this.blogRepository.getById(id);
    if (!existing) {
      throw new Error('Blog not found');
    }
    return this.blogRepository.delete(id);
  }
}
