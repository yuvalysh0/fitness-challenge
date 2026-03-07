import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export const PROGRESS_PHOTOS_BUCKET = 'progress-photos';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
  );

  get supabase(): SupabaseClient {
    return this.client;
  }

  /** Public URL for a progress photo path (bucket is public). */
  getPublicPhotoUrl(path: string): string {
    const { data } = this.client.storage.from(PROGRESS_PHOTOS_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
}
