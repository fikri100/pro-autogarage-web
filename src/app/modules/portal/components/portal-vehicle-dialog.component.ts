import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface PortalVehicleDialogData {
  mode: 'add' | 'edit';
  vehicle?: any;
}

@Component({
  selector: 'app-portal-vehicle-dialog',
  templateUrl: '../views/portal-vehicle-dialog.html',
  standalone: false
})
export class PortalVehicleDialogComponent implements OnInit {
  vehicleForm!: FormGroup;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<PortalVehicleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PortalVehicleDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const v = this.data.vehicle;
    this.vehicleForm = this.fb.group({
      licensePlate: [v?.licensePlate || '', [Validators.required, Validators.pattern(/^[a-zA-Z]{1,3}\s[0-9]{1,4}\s[a-zA-Z]{1,3}$/)]],
      brand: [v?.brand || '', [Validators.required]],
      model: [v?.model || '', [Validators.required]],
      yearMade: [v?.yearMade || new Date().getFullYear(), [Validators.required, Validators.min(1980), Validators.max(new Date().getFullYear() + 1)]],
      transmission: [v?.transmission || 'AUTOMATIC', [Validators.required]]
    });
  }

  onPlateInput(event: any): void {
    let val = event.target.value.toUpperCase();
    this.vehicleForm.get('licensePlate')?.setValue(val, { emitEvent: false });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (this.vehicleForm.invalid) return;
    this.isSaving = true;
    
    const formVal = { ...this.vehicleForm.value };
    formVal.licensePlate = formVal.licensePlate.trim().toUpperCase();
    
    this.dialogRef.close(formVal);
  }
}
