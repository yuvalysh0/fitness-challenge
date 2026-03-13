import { Component, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatMenuModule } from '@angular/material/menu';

export interface HabitFormValue {
  label: string;
  icon: string;
}

@Component({
  selector: 'app-habit-form-row',
  standalone: true,
  imports: [FormsModule, MatMenuModule],
  templateUrl: './habit-form-row.component.html',
  styleUrl: './habit-form-row.component.scss',
})
export class HabitFormRowComponent implements OnInit {
  readonly initialLabel = input<string>('');
  readonly initialIcon = input<string>('✓');
  readonly emojiOptions = input.required<readonly string[]>();

  readonly saved = output<HabitFormValue>();
  readonly cancelled = output<void>();

  readonly label = signal('');
  readonly icon = signal('✓');

  ngOnInit(): void {
    this.label.set(this.initialLabel());
    this.icon.set(this.initialIcon());
  }

  setIcon(emoji: string): void {
    this.icon.set(emoji);
  }

  save(): void {
    const label = this.label().trim();
    if (!label) return;
    this.saved.emit({ label, icon: this.icon() });
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
