import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Product } from '../models/object';
import { InventoryService } from '../inventory.service';

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

  itemTypes: { value: string; label: string }[] = [];
  filteredItemTypes$!: Observable<any[]>;
  filteredCategories$!: Observable<any[]>;

  categories: { [key: string]: string[] } = {
    SPR: [],
    SRV: []
  };

  currentCategories: string[] = [];

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    public dialogRef: MatDialogRef<ProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductDialogData
  ) {}

  ngOnInit(): void {
    if (this.data.mode !== 'confirm') {
      const p = this.data.product;
      this.productForm = this.fb.group({
        code: [p?.code ?? '', [Validators.required, Validators.pattern(/^[a-zA-Z0-9\-_]+$/)]],
        name: [p?.name ?? '', [Validators.required]],
        itemType: [p?.itemType ?? null, [Validators.required]],
        category: [p?.category ?? null, [Validators.required]],
        purchasePrice: [p?.purchasePrice ?? 0, [Validators.min(0)]],
        salePrice: [p?.salePrice ?? 0, [Validators.required, Validators.min(0)]],
        stockQuantity: [p?.stockQuantity ?? 0, [Validators.min(0)]],
        minStockLimit: [p?.minStockLimit ?? 5, [Validators.min(0)]]
      });

      this.inventoryService.getParamsByGroup('ITEM_TYPE').subscribe(typeData => {
        this.itemTypes = (typeData || []).map(t => ({
          value: t.kode_param,
          label: t.nama_param
        }));

        this.inventoryService.getParamsByGroup('PRODUCT_CATEGORY_SPR').subscribe(sprData => {
          this.categories['SPR'] = (sprData || []).map(c => c.kode_param);

          this.inventoryService.getParamsByGroup('PRODUCT_CATEGORY_SRV').subscribe(srvData => {
            this.categories['SRV'] = (srvData || []).map(c => c.kode_param);

            this.updateFormValidation(p?.itemType ?? 'SPR');

            // Watch for changes in itemType to dynamically toggle fields and categories
            this.productForm.get('itemType')?.valueChanges.subscribe((type: 'SPR' | 'SRV' | string) => {
              if (type === 'SPR' || type === 'SRV') {
                this.updateFormValidation(type as 'SPR' | 'SRV');
              }
            });

            this.setupAutocomplete();
          });
        });
      });
    }
  }

  setupAutocomplete() {
    this.filteredItemTypes$ = this.productForm.get('itemType')!.valueChanges.pipe(
      startWith(this.productForm.get('itemType')!.value || ''),
      map(value => {
        const name = typeof value === 'string' ? value : (this.getItemTypeLabel(value) || '');
        return name ? this.itemTypes.filter(t => t.label.toLowerCase().includes(name.toLowerCase())) : this.itemTypes.slice();
      })
    );

    this.filteredCategories$ = this.productForm.get('category')!.valueChanges.pipe(
      startWith(this.productForm.get('category')!.value || ''),
      map(value => {
        const name = typeof value === 'string' ? value : value;
        return name ? this.currentCategories.filter(c => c.toLowerCase().includes(name.toLowerCase())) : this.currentCategories.slice();
      })
    );
  }

  getItemTypeLabel(value: string): string {
    const t = this.itemTypes.find(o => o.value === value);
    return t ? t.label : value;
  }

  displayItemType = (value: string): string => {
    return this.getItemTypeLabel(value);
  }

  displayCategory = (value: string): string => {
    return value;
  }

  updateFormValidation(type: 'SPR' | 'SRV'): void {
    this.currentCategories = this.categories[type] || [];
    
    // Auto adjust category value if not in the current list
    const currentCategoryVal = this.productForm.get('category')?.value;
    if (currentCategoryVal && !this.currentCategories.includes(currentCategoryVal)) {
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
