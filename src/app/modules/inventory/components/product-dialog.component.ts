import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Product } from '../models/object';

export interface ProductDialogData {
  mode: 'add' | 'edit' | 'confirm';
  product?: Product;
  message?: string;
}

@Component({
  selector: 'app-product-dialog',
  templateUrl: '../views/product-dialog.html',
  standalone: false
})
export class ProductDialogComponent implements OnInit {
  productForm!: FormGroup;
  isSaving = false;

  categories = {
    SPR: ['Oli', 'Filter', 'Busi', 'Aki', 'Rem', 'Ban', 'Suspensi', 'Lampu', 'Kelistrikan', 'Lainnya'],
    SRV: ['Servis Ringan', 'Tune Up', 'Servis Berkala', 'Spooring & Balancing', 'Sistem Rem', 'Kaki-kaki', 'Sistem AC', 'Turun Mesin (Overhaul)', 'Lainnya']
  };

  currentCategories: string[] = [];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductDialogData
  ) {}

  ngOnInit(): void {
    if (this.data.mode !== 'confirm') {
      const p = this.data.product;
      this.productForm = this.fb.group({
        code: [p?.code ?? '', [Validators.required, Validators.pattern(/^[a-zA-Z0-9\-_]+$/)]],
        name: [p?.name ?? '', [Validators.required]],
        itemType: [p?.itemType ?? 'SPR', [Validators.required]],
        category: [p?.category ?? 'Lainnya', [Validators.required]],
        purchasePrice: [p?.purchasePrice ?? 0, [Validators.min(0)]],
        salePrice: [p?.salePrice ?? 0, [Validators.required, Validators.min(0)]],
        stockQuantity: [p?.stockQuantity ?? 0, [Validators.min(0)]],
        minStockLimit: [p?.minStockLimit ?? 5, [Validators.min(0)]]
      });

      this.updateFormValidation(p?.itemType ?? 'SPR');
      
      // Watch for changes in itemType to dynamically toggle fields and categories
      this.productForm.get('itemType')?.valueChanges.subscribe((type: 'SPR' | 'SRV') => {
        this.updateFormValidation(type);
      });
    }
  }

  updateFormValidation(type: 'SPR' | 'SRV'): void {
    this.currentCategories = this.categories[type] || [];
    
    // Auto adjust category value if not in the current list
    const currentCategoryVal = this.productForm.get('category')?.value;
    if (!this.currentCategories.includes(currentCategoryVal)) {
      this.productForm.get('category')?.setValue(this.currentCategories[0] || 'Lainnya');
    }

    const purchasePriceCtrl = this.productForm.get('purchasePrice');
    const stockQuantityCtrl = this.productForm.get('stockQuantity');
    const minStockLimitCtrl = this.productForm.get('minStockLimit');

    if (type === 'SRV') {
      // For service, these values must be 0 and are not required
      purchasePriceCtrl?.setValue(0);
      purchasePriceCtrl?.clearValidators();
      purchasePriceCtrl?.disable();

      stockQuantityCtrl?.setValue(0);
      stockQuantityCtrl?.clearValidators();
      stockQuantityCtrl?.disable();

      minStockLimitCtrl?.setValue(0);
      minStockLimitCtrl?.clearValidators();
      minStockLimitCtrl?.disable();
    } else {
      // For sparepart, restore controls
      purchasePriceCtrl?.enable();
      purchasePriceCtrl?.setValidators([Validators.required, Validators.min(0)]);

      stockQuantityCtrl?.enable();
      stockQuantityCtrl?.setValidators([Validators.required, Validators.min(0)]);

      minStockLimitCtrl?.enable();
      minStockLimitCtrl?.setValidators([Validators.required, Validators.min(0)]);
    }

    purchasePriceCtrl?.updateValueAndValidity();
    stockQuantityCtrl?.updateValueAndValidity();
    minStockLimitCtrl?.updateValueAndValidity();
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    
    // Get raw values because disabled controls are not included in this.productForm.value
    const val = this.productForm.getRawValue();
    this.dialogRef.close(val);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
