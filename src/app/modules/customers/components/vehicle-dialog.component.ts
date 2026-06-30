import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Vehicle } from '../models/object';
import { BookingService } from '../../booking/booking.service';

export interface VehicleDialogData {
  mode: 'add' | 'edit' | 'confirm';
  customerId?: number;
  vehicle?: Vehicle;
  message?: string;
}

@Component({
  selector: 'app-vehicle-dialog',
  templateUrl: '../views/vehicle-dialog.html',
  standalone: false
})
export class VehicleDialogComponent implements OnInit {
  vehicleForm!: FormGroup;
  isSaving = false;

  transmissions: { value: string; label: string }[] = [];
  filteredTransmissions$!: Observable<any[]>;

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    public dialogRef: MatDialogRef<VehicleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VehicleDialogData
  ) {}

  ngOnInit(): void {
    if (this.data.mode !== 'confirm') {
      this.initForm();
      this.bookingService.getParamsByGroup('VEHICLE_TRANSMISSION').subscribe(data => {
        this.transmissions = (data || []).map(p => ({
          value: p.nama_param,
          label: p.nama_param
        }));
        this.setupAutocomplete();
      });
    }
  }

  setupAutocomplete() {
    this.filteredTransmissions$ = this.vehicleForm.get('transmission')!.valueChanges.pipe(
      startWith(this.vehicleForm.get('transmission')!.value || ''),
      map(value => {
        const name = typeof value === 'string' ? value : value;
        return name ? this.transmissions.filter(t => t.label.toLowerCase().includes(name.toLowerCase())) : this.transmissions.slice();
      })
    );
  }

  displayTransmission = (value: string): string => {
    return value || '';
  }

  private initForm(): void {
    const v = this.data.vehicle;
    this.vehicleForm = this.fb.group({
      customerId: [this.data.customerId || v?.customerId || null],
      licensePlate: [v?.licensePlate || '', [Validators.required, Validators.pattern(/^[A-Z]{1,3}\s[0-9]{1,4}\s[A-Z]{1,3}$/)]],
      brand: [v?.brand || '', [Validators.required]],
      model: [v?.model || '', [Validators.required]],
      yearMade: [v?.yearMade || null],
      transmission: [v?.transmission || null]
    });
  }

  /**
   * Formats raw input into Indonesian license plate format: AA 1234 ABC
   * Strips invalid chars, auto-inserts spaces between letter/digit segments.
   */
  private formatPlate(raw: string): string {
    // Remove all non-alphanumeric characters
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Extract segments: leading letters, middle digits, trailing letters
    const match = clean.match(/^([A-Z]{1,3})([0-9]{0,4})([A-Z]{0,3})/);
    if (!match) return clean;

    const [, prefix, numbers, suffix] = match;
    let result = prefix;
    if (numbers) result += ' ' + numbers;
    if (suffix)  result += ' ' + suffix;
    return result;
  }

  onPlateInput(event: any): void {
    const cursor = event.target.selectionStart;
    const formatted = this.formatPlate(event.target.value);
    this.vehicleForm.get('licensePlate')?.setValue(formatted, { emitEvent: false });
    // Restore cursor position after value replacement
    event.target.value = formatted;
    event.target.setSelectionRange(formatted.length, formatted.length);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onSave(): void {
    this.vehicleForm.markAllAsTouched();
    if (this.vehicleForm.invalid) return;
    this.isSaving = true;
    
    const formVal = { ...this.vehicleForm.value };
    formVal.licensePlate = this.formatPlate(formVal.licensePlate);
    
    this.dialogRef.close(formVal);
  }
}
