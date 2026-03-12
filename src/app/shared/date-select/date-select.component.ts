import { Component, input, output, computed } from '@angular/core';

const MONTHS = [
  { v: '01', l: 'January' },
  { v: '02', l: 'February' },
  { v: '03', l: 'March' },
  { v: '04', l: 'April' },
  { v: '05', l: 'May' },
  { v: '06', l: 'June' },
  { v: '07', l: 'July' },
  { v: '08', l: 'August' },
  { v: '09', l: 'September' },
  { v: '10', l: 'October' },
  { v: '11', l: 'November' },
  { v: '12', l: 'December' },
];

@Component({
  selector: 'app-date-select',
  standalone: true,
  imports: [],
  templateUrl: './date-select.component.html',
  styleUrl: './date-select.component.scss',
})
export class DateSelectComponent {
  /** Current date value in YYYY-MM-DD format. */
  readonly value = input<string>('');

  /** Emitted on any change — YYYY-MM-DD string. */
  readonly valueChange = output<string>();

  /**
   * Year range mode:
   * - 'past' (default): years from current-120 to current-10 (for birth dates)
   * - 'future': years from current to current+30 (for end dates)
   * - 'any': current-10 to current+30
   */
  readonly yearMode = input<'past' | 'future' | 'any'>('past');

  readonly months = MONTHS;
  readonly days = Array.from({ length: 31 }, (_, i) => i + 1);

  readonly years = computed(() => {
    const cur = new Date().getFullYear();
    switch (this.yearMode()) {
      case 'future':
        return Array.from({ length: 31 }, (_, i) => cur + i);
      case 'any':
        return Array.from({ length: 41 }, (_, i) => cur - 10 + i);
      default:
        return Array.from({ length: 111 }, (_, i) => cur - 10 - i);
    }
  });

  // Parsed parts from the current value
  readonly day = computed(() => {
    const [, , d] = (this.value() || '').split('-');
    return d ? String(parseInt(d, 10)) : '';
  });

  readonly month = computed(() => {
    const [, m] = (this.value() || '').split('-');
    return m ?? '';
  });

  readonly year = computed(() => {
    const [y] = (this.value() || '').split('-');
    return y ?? '';
  });

  onPart(part: 'day' | 'month' | 'year', raw: string): void {
    const current = this.value() || '1990-01-01';
    const [y, m, d] = current.split('-');
    const next = {
      year: part === 'year' ? raw : (y ?? '1990'),
      month: part === 'month' ? raw.padStart(2, '0') : (m ?? '01'),
      day: part === 'day' ? raw.padStart(2, '0') : (d ?? '01'),
    };
    this.valueChange.emit(`${next.year}-${next.month}-${next.day}`);
  }
}
