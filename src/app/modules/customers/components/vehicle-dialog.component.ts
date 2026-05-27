import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<VehicleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VehicleDialogData
  ) {}

  ngOnInit(): void {
    if (this.data.mode !== 'confirm') {
      this.initForm();
    }
  }

  private initForm(): void {
    const v = this.data.vehicle;
    this.vehicleForm = this.fb.group({
      customerId: [this.data.customerId || v?.customerId || null],
      licensePlate: [v?.licensePlate || '', [Validators.required]],
      brand: [v?.brand || '', [Validators.required]],
      model: [v?.model || '', [Validators.required]],
      yearMade: [v?.yearMade || null],
      transmission: [v?.transmission || 'Manual (MT)']
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
