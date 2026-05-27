import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { InventoryService } from '../inventory.service';
import { Product, StockLog } from '../models/object';
import { ProductDialogComponent } from './product-dialog.component';
import { RestockDialogComponent } from './restock-dialog.component';

@Component({
  selector: 'app-inventory-list',
  templateUrl: '../views/inventory.html',
  standalone: false
})
export class InventoryComponent implements OnInit {
  products: Product[] = [];
  loading = false;
  selectedProduct: Product | null = null;
  stockLogs: StockLog[] = [];
  logsLoading = false;

  // Filters State
  searchQuery = '';
  selectedType: 'ALL' | 'SPR' | 'SRV' = 'ALL';
  lowStockOnly = false;

  private searchSubject = new Subject<string>();

  displayedColumns: string[] = ['code', 'name', 'category', 'stock', 'price', 'actions'];

  constructor(
    private inventoryService: InventoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProducts();

    // Setup debounced search for performance
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery = query;
      this.loadProducts();
    });
  }

  onSearchChange(event: Event): void {
    const inputVal = (event.target as HTMLInputElement).value;
    this.searchSubject.next(inputVal);
  }

  filterByType(type: 'ALL' | 'SPR' | 'SRV'): void {
    this.selectedType = type;
    this.loadProducts();
  }

  toggleLowStock(): void {
    this.lowStockOnly = !this.lowStockOnly;
    this.loadProducts();
  }
  loadProducts(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.inventoryService.getProducts(this.searchQuery, this.selectedType, this.lowStockOnly).subscribe({
      next: (data: Product[]) => {
        this.products = data || [];
        
        // Reset or adjust selected product details
        if (this.products.length > 0) {
          // If we had a selection, keep it if it's still in the list, otherwise select the first item
          const exists = this.products.find(p => p.id === this.selectedProduct?.id);
          this.selectedProduct = exists || this.products[0];
          if (this.selectedProduct && this.selectedProduct.itemType === 'SPR') {
            this.loadStockLogs(this.selectedProduct.id!);
          } else {
            this.stockLogs = [];
          }
        } else {
          this.selectedProduct = null;
          this.stockLogs = [];
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading products:', err);
        this.snackBar.open('Gagal memuat data inventaris', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectProduct(product: Product): void {
    this.selectedProduct = product;
    if (product && product.itemType === 'SPR') {
      this.loadStockLogs(product.id!);
    } else {
      this.stockLogs = [];
    }
  }

  loadStockLogs(productId: number): void {
    this.logsLoading = true;
    this.inventoryService.getProductStockLogs(productId).subscribe({
      next: (data: StockLog[]) => {
        this.stockLogs = data || [];
        this.logsLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading stock logs:', err);
        this.logsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  showRestockModal(product: Product): void {
    const dialogRef = this.dialog.open(RestockDialogComponent, {
      width: '520px',
      disableClose: false,
      data: { product }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.inventoryService.restockProduct(result).subscribe({
          next: () => {
            this.snackBar.open('Proses restock barang berhasil diproses!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadProducts();
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
  getInitials(name: string): string {
    if (!name) return 'P';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getStockStatus(p: Product): 'danger' | 'warning' | 'success' {
    if (p.itemType === 'SRV') return 'success';
    if (!p.stockQuantity || p.stockQuantity <= 0) return 'danger';
    if (p.stockQuantity <= (p.minStockLimit ?? 5)) return 'warning';
    return 'success';
  }

  showAddModal(): void {
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '620px',
      disableClose: false,
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.inventoryService.createProduct(result).subscribe({
          next: () => {
            this.snackBar.open('Item inventaris berhasil ditambahkan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadProducts();
          },
          error: (err: any) => {
            console.error('Error creating product:', err);
            const errMsg = err.error || 'Gagal menambahkan item inventaris';
            this.snackBar.open(errMsg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }

  showEditModal(product: Product): void {
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '620px',
      disableClose: false,
      data: { mode: 'edit', product }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.inventoryService.updateProduct(product.id!, result).subscribe({
          next: () => {
            this.snackBar.open('Data inventaris berhasil diperbarui!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            if (this.selectedProduct?.id === product.id) {
              this.selectedProduct = { ...this.selectedProduct, ...result };
            }
            this.loadProducts();
          },
          error: (err: any) => {
            console.error('Error updating product:', err);
            const errMsg = err.error || 'Gagal memperbarui item inventaris';
            this.snackBar.open(errMsg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }

  deleteProduct(product: Product): void {
    const label = product.itemType === 'SPR' ? 'sparepart' : 'jasa';
    const dialogRef = this.dialog.open(ProductDialogComponent, {
      width: '400px',
      data: { mode: 'confirm', message: `Hapus ${label} "${product.name}" (${product.code})?` }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.inventoryService.deleteProduct(product.id!).subscribe({
          next: () => {
            this.snackBar.open('Item berhasil dihapus', 'OK', { duration: 3000, panelClass: 'snack-success' });
            if (this.selectedProduct?.id === product.id) {
              this.selectedProduct = null;
            }
            this.loadProducts();
          },
          error: () => {
            this.snackBar.open('Gagal menghapus item', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }
}
