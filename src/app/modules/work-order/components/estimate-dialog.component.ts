import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { WorkOrderService } from '../work-order.service';

@Component({
  selector: 'app-estimate-dialog',
  templateUrl: '../views/estimate-dialog.html',
  standalone: false
})
export class EstimateDialogComponent implements OnInit {
  itemForm!: FormGroup;
  products: any[] = [];
  filteredProducts: any[] = [];
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
      this.filteredProducts = this.products;
    });
  }

  filterProducts(event: Event): void {
    const search = (event.target as HTMLInputElement).value.toLowerCase();
    if (!search) {
      this.filteredProducts = this.products;
    } else {
      this.filteredProducts = this.products.filter(p =>
        p.name.toLowerCase().includes(search) || p.code.toLowerCase().includes(search)
      );
    }
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
