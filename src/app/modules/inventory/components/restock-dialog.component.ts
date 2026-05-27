import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Product } from '../models/object';

export interface RestockDialogData {
  product: Product;
}

@Component({
  selector: 'app-restock-dialog',
  templateUrl: '../views/restock-dialog.html',
  standalone: false
})
export class RestockDialogComponent implements OnInit {
  restockForm!: FormGroup;
  isSaving = false;
  product!: Product;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<RestockDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RestockDialogData
  ) {
    this.product = data.product;
  }

  ngOnInit(): void {
    // Generate an automatic PO Reference Number: PO-YYYYMMDD-HHMM
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const defaultRef = `PO-${year}${month}${date}-${hour}${minute}`;

    this.restockForm = this.fb.group({
      productId: [this.product.id, [Validators.required]],
      quantity: [null, [Validators.required, Validators.min(1)]],
      purchasePrice: [this.product.purchasePrice || null, [Validators.required, Validators.min(1)]],
      referenceId: [defaultRef, [Validators.required, Validators.maxLength(50)]],
      recordExpense: [true]
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (this.restockForm.invalid) {
      this.restockForm.markAllAsTouched();
      return;
    }

    const payload = this.restockForm.value;
    this.dialogRef.close(payload);
  }
}
