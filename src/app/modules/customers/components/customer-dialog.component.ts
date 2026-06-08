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
        phone: [this.data.customer?.phone ?? null, [Validators.required, Validators.pattern('^[0-9]*$')]],
        email: [this.data.customer?.email ?? null, [Validators.email]],
        address: [this.data.customer?.address ?? null],
        plate: [null, [Validators.pattern(/^[A-Z]{1,3}\s[0-9]{1,4}\s[A-Z]{1,3}$/)]],
        brand: [null],
        year: [null]
      });
    }
  }

  /**
   * Formats raw input into Indonesian license plate format: AA 1234 ABC
   * Strips invalid chars, auto-inserts spaces between letter/digit segments.
   */
  private formatPlate(raw: string): string {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const match = clean.match(/^([A-Z]{1,3})([0-9]{0,4})([A-Z]{0,3})/);
    if (!match) return clean;
    const [, prefix, numbers, suffix] = match;
    let result = prefix;
    if (numbers) result += ' ' + numbers;
    if (suffix)  result += ' ' + suffix;
    return result;
  }

  onPlateInput(event: any): void {
    const formatted = this.formatPlate(event.target.value);
    this.customerForm.get('plate')?.setValue(formatted, { emitEvent: false });
    event.target.value = formatted;
    event.target.setSelectionRange(formatted.length, formatted.length);
  }

  onPhoneKeyPress(event: KeyboardEvent): void {
    const charCode = event.key;
    // Allow numbers, and control keys like Backspace/Arrow keys (which have longer key names)
    if (!/^[0-9]$/.test(charCode) && charCode.length === 1) {
      event.preventDefault();
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
