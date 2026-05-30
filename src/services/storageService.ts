import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';

export class StorageService {
  private supabase: SupabaseClient;
  private readonly bucketName = 'blog-images';

  constructor() {
    this.supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }

  async uploadImage(file: Express.Multer.File, customBucket?: string): Promise<string> {
    const bucket = customBucket || this.bucketName;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      // If a custom bucket upload failed, attempt a fallback to the default public blog-images bucket
      if (bucket !== this.bucketName) {
        console.warn(`Upload to bucket '${bucket}' failed: ${error.message}. Falling back to default bucket '${this.bucketName}'...`);
        return this.uploadImage(file, this.bucketName);
      }
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  }
}
