import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Vehicle } from '../models/object';

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

  transmissions = [
    { value: 'Manual (MT)', label: 'Manual (MT)' },
    { value: 'Automatic (AT)', label: 'Automatic (AT)' },
    { value: 'CVT', label: 'CVT' },
    { value: 'Lainnya', label: 'Lainnya' }
  ];
  filteredTransmissions$!: Observable<any[]>;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<VehicleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VehicleDialogData
  ) {}

  ngOnInit(): void {
    if (this.data.mode !== 'confirm') {
      this.initForm();
      this.setupAutocomplete();
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
      licensePlate: [v?.licensePlate || '', [Validators.required]],
      brand: [v?.brand || '', [Validators.required]],
      model: [v?.model || '', [Validators.required]],
      yearMade: [v?.yearMade || null],
      transmission: [v?.transmission || null]
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onSave(): void {
    if (this.vehicleForm.invalid) return;
    this.isSaving = true;
    
    // Force license plate to uppercase
    const formVal = { ...this.vehicleForm.value };
    formVal.licensePlate = formVal.licensePlate.trim().toUpperCase();
    
    this.dialogRef.close(formVal);
  }
}
