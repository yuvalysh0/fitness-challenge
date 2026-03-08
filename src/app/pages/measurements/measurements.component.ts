import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { form, FormField } from '@angular/forms/signals';
import { ChallengeService } from '../../core/challenge.service';
import { MeasurementSet } from '../../models';

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Form model for a new measurement (id is generated on save). All fields required for form() field tree. */
interface MeasurementFormModel {
  date: string;
  chest: number;
  waist: number;
  hips: number;
  armL: number;
  armR: number;
  thighL: number;
  thighR: number;
  notes: string;
}

function emptyFormModel(): MeasurementFormModel {
  return {
    date: todayString(),
    chest: 0,
    waist: 0,
    hips: 0,
    armL: 0,
    armR: 0,
    thighL: 0,
    thighR: 0,
    notes: '',
  };
}

@Component({
  selector: 'app-measurements',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, FormField],
  templateUrl: './measurements.component.html',
  styleUrl: './measurements.component.scss',
})
export class MeasurementsComponent {
  private readonly store = inject(ChallengeService);

  readonly measurements = this.store.measurements;
  readonly measurementModel = signal<MeasurementFormModel>(emptyFormModel());
  readonly measurementForm = form(this.measurementModel);
  readonly showForm = signal(false);

  openForm(): void {
    this.measurementModel.set(emptyFormModel());
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  deleteMeasurement(id: string): void {
    this.store.removeMeasurement(id);
  }

  saveMeasurement(): void {
    const data = this.measurementModel();
    const n = (v: number) => (v != null && !Number.isNaN(v) && v !== 0 ? v : undefined);
    const m: MeasurementSet = {
      id: crypto.randomUUID(),
      date: data.date,
      notes: data.notes.trim() || undefined,
    };
    const chest = n(data.chest);
    if (chest != null) m.chest = chest;
    const waist = n(data.waist);
    if (waist != null) m.waist = waist;
    const hips = n(data.hips);
    if (hips != null) m.hips = hips;
    const armL = n(data.armL);
    if (armL != null) m.armL = armL;
    const armR = n(data.armR);
    if (armR != null) m.armR = armR;
    const thighL = n(data.thighL);
    if (thighL != null) m.thighL = thighL;
    const thighR = n(data.thighR);
    if (thighR != null) m.thighR = thighR;
    this.store.addMeasurement(m);
    this.closeForm();
  }
}
