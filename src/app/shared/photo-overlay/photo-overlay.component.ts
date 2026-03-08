import { Component, HostListener, input, output } from '@angular/core';

/**
 * Reusable full-screen image overlay (lightbox). Renders when url is set;
 * closes on backdrop click, close button, or Escape. Emits close when user dismisses.
 */
@Component({
  selector: 'app-photo-overlay',
  standalone: true,
  imports: [],
  templateUrl: './photo-overlay.component.html',
  styleUrl: './photo-overlay.component.scss',
})
export class PhotoOverlayComponent {
  /** Image URL to show; when null/empty, overlay is not rendered. */
  readonly url = input<string | null>(null);

  /** Emitted when the user closes the overlay (backdrop, button, or Escape). */
  readonly close = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.url()) this.close.emit();
  }

  onBackdropClick(): void {
    this.close.emit();
  }
}
