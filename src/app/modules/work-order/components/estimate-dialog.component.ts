import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { WorkOrderService } from '../work-order.service';

@Component({
  selector: 'app-estimate-dialog',
  templateUrl: '../views/estimate-dialog.html',
  standalone: false
})
export class EstimateDialogComponent implements OnInit {
  itemForm!: FormGroup;
  products: any[] = [];
  filteredProducts$!: Observable<any[]>;
  selectedProduct: any = null;

  constructor(
    private fb: FormBuilder,
    private woService: WorkOrderService,
    public dialogRef: MatDialogRef<EstimateDialogComponent>
  ) {}

  ngOnInit(): void {
    this.itemForm = this.fb.group({
      productId: [null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });

    this.loadProducts();

    this.filteredProducts$ = this.itemForm.get('productId')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : (this.getProductName(value) || '');
        return name ? this._filterProducts(name) : this.products.slice();
      })
    );

    // Monitor product selection to show details (like stock, price)
    this.itemForm.get('productId')?.valueChanges.subscribe(prodId => {
      this.selectedProduct = this.products.find(p => p.id === prodId) || null;
      if (this.selectedProduct && this.selectedProduct.itemType === 'SPR') {
        const qtyControl = this.itemForm.get('quantity');
        qtyControl?.setValidators([Validators.required, Validators.min(1), Validators.max(this.selectedProduct.stockQuantity)]);
        qtyControl?.updateValueAndValidity();
      } else {
        const qtyControl = this.itemForm.get('quantity');
        qtyControl?.setValidators([Validators.required, Validators.min(1)]);
        qtyControl?.updateValueAndValidity();
      }
    });
  }

  loadProducts(): void {
    this.woService.getProducts().subscribe(data => {
      this.products = data || [];
      // Trigger value changes to update the filtered list
      this.itemForm.get('productId')?.updateValueAndValidity();
    });
  }

  private _filterProducts(name: string): any[] {
    const filterValue = name.toLowerCase();
    return this.products.filter(p =>
      p.name.toLowerCase().includes(filterValue) || p.code.toLowerCase().includes(filterValue)
    );
  }

  getProductName(id: number | null): string {
    if (!id) return '';
    const prod = this.products.find(p => p.id === id);
    return prod ? `[${prod.code}] ${prod.name}` : '';
  }

  displayProduct = (id: number): string => {
    return this.getProductName(id);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }
    
    if (this.selectedProduct) {
      const formValue = this.itemForm.value;
      const result = {
        productId: this.selectedProduct.id,
        productCode: this.selectedProduct.code,
        productName: this.selectedProduct.name,
        productType: this.selectedProduct.itemType,
        quantity: formValue.quantity,
        priceAtTransaction: this.selectedProduct.salePrice,
        subtotal: formValue.quantity * this.selectedProduct.salePrice
      };
      this.dialogRef.close(result);
    } else {
      this.dialogRef.close(null);
    }
  }
}
