import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

const QUOTE_OF_THE_DAY_URL = 'https://api.api-ninjas.com/v2/quoteoftheday';
const DAILY_QUOTES_TABLE = 'daily_quotes';

export interface Quote {
  quote: string;
  author: string;
  work?: string;
  categories?: string[];
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly http = inject(HttpClient);
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly apiKey = environment.apiNinjasKey;

  private readonly quote = signal<Quote | null>(null);
  private readonly loading = signal(false);
  private readonly error = signal<string | null>(null);

  readonly quoteOfTheDay = this.quote.asReadonly();
  readonly quoteLoading = this.loading.asReadonly();
  readonly quoteError = this.error.asReadonly();

  /**
   * Loads quote of the day: from DB first, else from API Ninjas then saves to DB (if authenticated).
   */
  fetchQuoteOfTheDay(): void {
    this.loading.set(true);
    this.error.set(null);
    this.loadQuoteOfTheDay().then(
      () => this.loading.set(false),
      (err) => {
        this.quote.set(null);
        this.loading.set(false);
        this.error.set(err?.message ?? 'Failed to load quote');
      },
    );
  }

  private async loadQuoteOfTheDay(): Promise<void> {
    const today = todayDateString();

    const fromDb = await this.getQuoteFromDb(today);
    if (fromDb) {
      this.quote.set(fromDb);
      this.error.set(null);
      return;
    }

    if (!this.apiKey?.trim()) {
      this.quote.set(null);
      this.error.set(null);
      return;
    }

    const fromApi = await this.fetchQuoteFromApi();
    if (!fromApi) {
      this.quote.set(null);
      return;
    }

    this.quote.set(fromApi);
    this.error.set(null);

    if (this.auth.isAuthenticated()) {
      await this.saveQuoteToDb(today, fromApi);
    }
  }

  private async getQuoteFromDb(date: string): Promise<Quote | null> {
    const { data, error } = await this.supabase.supabase
      .from(DAILY_QUOTES_TABLE)
      .select('quote, author, work')
      .eq('date', date)
      .maybeSingle();

    if (error || !data) return null;
    return {
      quote: data.quote,
      author: data.author,
      work: data.work ?? undefined,
    };
  }

  private async fetchQuoteFromApi(): Promise<Quote | null> {
    const arr = await firstValueFrom(
      this.http.get<Quote[]>(QUOTE_OF_THE_DAY_URL, {
        headers: { 'X-Api-Key': this.apiKey },
      }),
    );
    return Array.isArray(arr) && arr.length > 0 ? arr[0]! : null;
  }

  private async saveQuoteToDb(date: string, q: Quote): Promise<void> {
    await this.supabase.supabase.from(DAILY_QUOTES_TABLE).upsert(
      {
        date,
        quote: q.quote,
        author: q.author,
        work: q.work ?? null,
      },
      { onConflict: 'date' },
    );
  }
}
