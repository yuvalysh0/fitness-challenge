import { Component, HostListener, input, model, signal } from '@angular/core';

@Component({
  selector: 'app-emoji-picker',
  standalone: true,
  templateUrl: './emoji-picker.component.html',
  styleUrl: './emoji-picker.component.scss',
})
export class EmojiPickerComponent {
  readonly options = input.required<readonly string[]>();
  readonly value = model<string>('✓');

  readonly pickerOpen = signal(false);

  togglePicker(event: MouseEvent): void {
    event.stopPropagation();
    this.pickerOpen.update((v) => !v);
  }

  selectEmoji(emoji: string): void {
    this.value.set(emoji);
    this.pickerOpen.set(false);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.pickerOpen.set(false);
  }
}
