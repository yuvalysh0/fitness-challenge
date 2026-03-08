import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ChallengeService } from '../../core/challenge.service';
import { MeasurementSet } from '../../models';

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

@Component({
  selector: 'app-measurements',
  standalone: true,
  imports: [FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './measurements.component.html',
  styleUrl: './measurements.component.scss',
})
export class MeasurementsComponent {
  private readonly store = inject(ChallengeService);

  readonly measurements = this.store.measurements;

  showForm = signal(false);
  formDate = signal(todayString());
  formChest = signal<number | ''>('');
  formWaist = signal<number | ''>('');
  formHips = signal<number | ''>('');
  formArmL = signal<number | ''>('');
  formArmR = signal<number | ''>('');
  formThighL = signal<number | ''>('');
  formThighR = signal<number | ''>('');
  formNotes = signal('');

  openForm(): void {
    this.formDate.set(todayString());
    this.formChest.set('');
    this.formWaist.set('');
    this.formHips.set('');
    this.formArmL.set('');
    this.formArmR.set('');
    this.formThighL.set('');
    this.formThighR.set('');
    this.formNotes.set('');
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  saveMeasurement(): void {
    const m: MeasurementSet = {
      id: crypto.randomUUID(),
      date: this.formDate(),
      notes: this.formNotes() || undefined,
    };
    const n = (v: number | '') => (v === '' ? undefined : v);
    if (n(this.formChest()) != null) m.chest = n(this.formChest()) as number;
    if (n(this.formWaist()) != null) m.waist = n(this.formWaist()) as number;
    if (n(this.formHips()) != null) m.hips = n(this.formHips()) as number;
    if (n(this.formArmL()) != null) m.armL = n(this.formArmL()) as number;
    if (n(this.formArmR()) != null) m.armR = n(this.formArmR()) as number;
    if (n(this.formThighL()) != null) m.thighL = n(this.formThighL()) as number;
    if (n(this.formThighR()) != null) m.thighR = n(this.formThighR()) as number;
    this.store.addMeasurement(m);
    this.closeForm();
  }
}
