import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface CustomerDialogData {
  mode: 'add' | 'edit' | 'confirm';
  customer?: any;
  message?: string;
}

@Component({
  selector: 'app-customer-dialog',
  templateUrl: '../views/customer-dialog.html',
  standalone: false
})
export class CustomerDialogComponent implements OnInit {
  customerForm!: FormGroup;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CustomerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CustomerDialogData
  ) {}

  ngOnInit(): void {
    if (this.data.mode !== 'confirm') {
      this.customerForm = this.fb.group({
        name: [this.data.customer?.name ?? null, [Validators.required]],
        phone: [this.data.customer?.phone ?? null, [Validators.required]],
        email: [this.data.customer?.email ?? null, [Validators.email]],
        address: [this.data.customer?.address ?? null],
        plate: [null],
        brand: [null],
        year: [null]
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.customerForm.value);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
