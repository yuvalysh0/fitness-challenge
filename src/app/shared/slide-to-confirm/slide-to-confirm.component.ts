import {
  Component,
  input,
  output,
  signal,
  viewChild,
  ElementRef,
  HostListener,
} from '@angular/core';

@Component({
  selector: 'app-slide-to-confirm',
  standalone: true,
  imports: [],
  templateUrl: './slide-to-confirm.component.html',
  styleUrl: './slide-to-confirm.component.scss',
})
export class SlideToConfirmComponent {
  readonly visible = input<boolean>(false);
  readonly title = input<string>('WARNING');
  readonly message = input<string>('This action cannot be undone.');
  readonly slideLabel = input<string>('SLIDE TO CONFIRM');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly trackRef = viewChild<ElementRef<HTMLElement>>('slideTrack');

  readonly dragX = signal(0);
  readonly dragPct = signal(0);
  readonly isConfirming = signal(false);

  private isDragging = false;
  private trackLeft = 0;
  private trackWidth = 0;
  private handleWidth = 56;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible()) this.cancel();
  }

  onPointerDown(e: PointerEvent): void {
    const track = this.trackRef()?.nativeElement;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    this.trackLeft = rect.left;
    this.trackWidth = rect.width;
    this.isDragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.isDragging) return;
    const maxX = this.trackWidth - this.handleWidth;
    const x = Math.max(0, Math.min(e.clientX - this.trackLeft - this.handleWidth / 2, maxX));
    const pct = maxX > 0 ? (x / maxX) * 100 : 0;
    this.dragX.set(x);
    this.dragPct.set(pct);
  }

  onPointerUp(): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    if (this.dragPct() >= 85) {
      this.isConfirming.set(true);
      setTimeout(() => {
        this.isConfirming.set(false);
        this.dragX.set(0);
        this.dragPct.set(0);
        this.confirmed.emit();
      }, 400);
    } else {
      // Spring back
      this.dragX.set(0);
      this.dragPct.set(0);
    }
  }

  cancel(): void {
    this.dragX.set(0);
    this.dragPct.set(0);
    this.cancelled.emit();
  }
}
