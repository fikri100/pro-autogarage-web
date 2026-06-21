import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { InventoryService } from '../inventory.service';
import { Product, StockLog } from '../models/object';
import { RestockDialogComponent } from './restock-dialog.component';
import { ProductDialogComponent } from './product-dialog.component';

export interface ProductDetailDialogData {
  product: Product;
  initialTab?: number;
  mode?: 'view' | 'edit';
}

@Component({
  selector: 'app-product-detail-dialog',
  templateUrl: '../views/product-detail-dialog.html',
  standalone: false
})
export class ProductDetailDialogComponent implements OnInit {
  product!: Product;
  stockLogs: StockLog[] = [];
  logsLoading = false;
  isChanged = false;
  selectedTabIndex = 0;

  productForm!: FormGroup;
  isSaving = false;
  editMode = false;

  itemTypes = [
    { value: 'SPR', label: 'Sparepart' },
    { value: 'SRV', label: 'Jasa / Servis' }
  ];
  filteredItemTypes$!: Observable<any[]>;
  filteredCategories$!: Observable<any[]>;

  categories = {
    SPR: ['Oli', 'Filter', 'Busi', 'Aki', 'Rem', 'Ban', 'Suspensi', 'Lampu', 'Kelistrikan', 'Lainnya'],
    SRV: ['Servis Ringan', 'Tune Up', 'Servis Berkala', 'Spooring & Balancing', 'Sistem Rem', 'Kaki-kaki', 'Sistem AC', 'Turun Mesin (Overhaul)', 'Lainnya']
  };

  currentCategories: string[] = [];

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<ProductDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductDetailDialogData
  ) {
    if (data && data.product) {
      this.product = { ...data.product };
    }
  }

  ngOnInit(): void {
    if (this.product) {
      this.editMode = this.data.mode === 'edit';
      this.initForm();
      if (this.product.itemType === 'SPR') {
        this.loadStockLogs(this.product.id!);
      }

      if (this.data && this.data.initialTab !== undefined) {
        this.selectedTabIndex = this.data.initialTab;
      }

      // Handle closing via backdrop click or ESC key to return correct reload status
      this.dialogRef.backdropClick().subscribe(() => {
        this.dialogRef.close({ reload: this.isChanged });
      });

      this.dialogRef.keydownEvents().subscribe(event => {
        if (event.key === 'Escape') {
          this.dialogRef.close({ reload: this.isChanged });
        }
      });
    }
  }

  initForm(): void {
    const p = this.product;
    this.productForm = this.fb.group({
      code: [p.code ?? '', [Validators.required, Validators.pattern(/^[a-zA-Z0-9\-_]+$/)]],
      name: [p.name ?? '', [Validators.required]],
      itemType: [p.itemType ?? null, [Validators.required]],
      category: [p.category ?? null, [Validators.required]],
      purchasePrice: [p.purchasePrice ?? 0, [Validators.min(0)]],
      salePrice: [p.salePrice ?? 0, [Validators.required, Validators.min(0)]],
      stockQuantity: [p.stockQuantity ?? 0, [Validators.min(0)]],
      minStockLimit: [p.minStockLimit ?? 5, [Validators.min(0)]]
    });

    this.updateFormValidation(p.itemType ?? 'SPR');

    this.productForm.get('itemType')?.valueChanges.subscribe((type: 'SPR' | 'SRV' | string) => {
      if (type === 'SPR' || type === 'SRV') {
        this.updateFormValidation(type as 'SPR' | 'SRV');
      }
    });

    this.setupAutocomplete();

    if (!this.editMode) {
      this.productForm.disable();
    }
  }

  enableEditMode(): void {
    this.editMode = true;
    this.productForm.enable();
    this.updateFormValidation(this.productForm.get('itemType')?.value || 'SPR');
    this.selectedTabIndex = 1;
    this.cdr.detectChanges();
  }

  disableEditMode(): void {
    this.editMode = false;
    this.productForm.disable();
    if (this.product) {
      this.productForm.patchValue({
        code: this.product.code,
        name: this.product.name,
        itemType: this.product.itemType,
        category: this.product.category,
        purchasePrice: this.product.purchasePrice,
        salePrice: this.product.salePrice,
        stockQuantity: this.product.stockQuantity,
        minStockLimit: this.product.minStockLimit
      }, { emitEvent: false });
    }
    this.cdr.detectChanges();
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
      // Only enable if we are actually in editMode
      if (this.editMode) {
        purchasePriceCtrl?.enable();
        stockQuantityCtrl?.enable();
        minStockLimitCtrl?.enable();
      }
      purchasePriceCtrl?.setValidators([Validators.required, Validators.min(0)]);
      stockQuantityCtrl?.setValidators([Validators.required, Validators.min(0)]);
      minStockLimitCtrl?.setValidators([Validators.required, Validators.min(0)]);
    }

    purchasePriceCtrl?.updateValueAndValidity();
    stockQuantityCtrl?.updateValueAndValidity();
    minStockLimitCtrl?.updateValueAndValidity();
  }

  loadStockLogs(productId: number): void {
    this.logsLoading = true;
    this.cdr.detectChanges();

    this.inventoryService.getProductStockLogs(productId).subscribe({
      next: (data: StockLog[]) => {
        this.stockLogs = data || [];
        this.logsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading stock logs:', err);
        this.stockLogs = [];
        this.logsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  reloadProduct(): void {
    if (!this.product.id) return;
    this.inventoryService.getProduct(this.product.id).subscribe({
      next: (updatedProd: Product) => {
        this.product = updatedProd;
        this.isChanged = true;
        
        // Re-populate the form with updated product data
        this.productForm.patchValue({
          code: updatedProd.code,
          name: updatedProd.name,
          itemType: updatedProd.itemType,
          category: updatedProd.category,
          purchasePrice: updatedProd.purchasePrice,
          salePrice: updatedProd.salePrice,
          stockQuantity: updatedProd.stockQuantity,
          minStockLimit: updatedProd.minStockLimit
        }, { emitEvent: false });

        if (!this.editMode) {
          this.productForm.disable();
        } else {
          this.updateFormValidation(updatedProd.itemType ?? 'SPR');
        }

        if (this.product.itemType === 'SPR') {
          this.loadStockLogs(this.product.id!);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error reloading product:', err);
      }
    });
  }

  getStockStatus(): 'danger' | 'warning' | 'success' {
    const p = this.product;
    if (p.itemType === 'SRV') return 'success';
    if (!p.stockQuantity || p.stockQuantity <= 0) return 'danger';
    if (p.stockQuantity <= (p.minStockLimit ?? 5)) return 'warning';
    return 'success';
  }

  showRestock(): void {
    const dialogRef = this.dialog.open(RestockDialogComponent, {
      width: '520px',
      disableClose: false,
      data: { product: this.product }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.inventoryService.restockProduct(result).subscribe({
          next: () => {
            this.snackBar.open('Proses restock barang berhasil diproses!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.reloadProduct();
          },
          error: (err: any) => {
            console.error('Error in restocking:', err);
            const errMsg = err.error || 'Gagal memproses restock barang';
            this.snackBar.open(errMsg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }

  onSaveEdit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.cdr.detectChanges();

    const val = this.productForm.getRawValue();
    this.inventoryService.updateProduct(this.product.id!, val).subscribe({
      next: () => {
        this.snackBar.open('Data inventaris berhasil diperbarui!', 'OK', { duration: 3000, panelClass: 'snack-success' });
        this.isSaving = false;
        this.editMode = false;
        this.productForm.disable();
        this.selectedTabIndex = 0; // Switch back to Detail Tab
        this.reloadProduct();
      },
      error: (err: any) => {
        console.error('Error updating product:', err);
        const errMsg = err.error || 'Gagal memperbarui item inventaris';
        this.snackBar.open(errMsg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  onDelete(): void {
    const label = this.product.itemType === 'SPR' ? 'sparepart' : 'jasa';
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '400px',
      data: { mode: 'confirm', message: `Hapus ${label} "${this.product.name}" (${this.product.code})?` }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.inventoryService.deleteProduct(this.product.id!).subscribe({
          next: () => {
            this.snackBar.open('Item berhasil dihapus', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.dialogRef.close({ reload: true });
          },
          error: () => {
            this.snackBar.open('Gagal menghapus item', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }

  onClose(): void {
    this.dialogRef.close({ reload: this.isChanged });
  }
}
