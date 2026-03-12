import {
  Component,
  input,
  output,
  signal,
  computed,
  effect,
  inject,
  HostListener,
} from '@angular/core';
import type { ProgressRefEntry } from '../../pages/dashboard/progress-reference-card/progress-reference-card.component';
import { SupabaseService } from '../../core/supabase.service';

@Component({
  selector: 'app-transformation-gallery',
  standalone: true,
  imports: [],
  templateUrl: './transformation-gallery.component.html',
  styleUrl: './transformation-gallery.component.scss',
})
export class TransformationGalleryComponent {
  private readonly supabase = inject(SupabaseService);

  readonly entries = input<ProgressRefEntry[]>([]);
  readonly startIndex = input<number>(0);
  readonly visible = input<boolean>(false);
  readonly closed = output<void>();

  readonly activeIndex = signal(0);

  constructor() {
    effect(() => {
      if (this.visible()) {
        this.activeIndex.set(this.startIndex());
      }
    });
  }

  readonly activeEntry = computed(() => this.entries()[this.activeIndex()] ?? null);
  readonly total = computed(() => this.entries().length);
  readonly hasPrev = computed(() => this.activeIndex() > 0);
  readonly hasNext = computed(() => this.activeIndex() < this.total() - 1);

  prev(): void {
    if (this.hasPrev()) this.activeIndex.update((i) => i - 1);
  }

  next(): void {
    if (this.hasNext()) this.activeIndex.update((i) => i + 1);
  }

  close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (!this.visible()) return;
    if (e.key === 'ArrowLeft') this.prev();
    if (e.key === 'ArrowRight') this.next();
    if (e.key === 'Escape') this.close();
  }

  private pointerStartX = 0;

  onPointerDown(e: PointerEvent): void {
    this.pointerStartX = e.clientX;
  }

  onPointerUp(e: PointerEvent): void {
    const delta = e.clientX - this.pointerStartX;
    if (Math.abs(delta) > 50) {
      delta < 0 ? this.next() : this.prev();
    }
  }

  photoUrl(entry: ProgressRefEntry): string {
    if (entry.photoDataUrl) return entry.photoDataUrl;
    if (entry.photoPath) return this.supabase.getPublicPhotoUrl(entry.photoPath);
    return '';
  }
}
