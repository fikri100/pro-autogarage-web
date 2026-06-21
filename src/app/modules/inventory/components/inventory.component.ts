import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { InventoryService } from '../inventory.service';
import { Product, StockLog } from '../models/object';
import { ProductDialogComponent } from './product-dialog.component';
import { RestockDialogComponent } from './restock-dialog.component';
import { ProductDetailDialogComponent } from './product-detail-dialog.component';

@Component({
  selector: 'app-inventory-list',
  templateUrl: '../views/inventory.html',
  standalone: false
})
export class InventoryComponent implements OnInit {
  products: Product[] = [];
  loading = false;

  totalData = 0;
  currentPage = 1;
  pageSize = 10;

  // Filters State
  searchQuery = '';
  selectedType: 'ALL' | 'SPR' | 'SRV' = 'ALL';
  lowStockOnly = false;

  private searchSubject = new Subject<string>();

  displayedColumns: string[] = ['code', 'name', 'category', 'type', 'stock', 'purchasePrice', 'salePrice', 'actions'];

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
    this.currentPage = 1;
    this.searchSubject.next(inputVal);
  }

  filterByType(type: 'ALL' | 'SPR' | 'SRV'): void {
    this.selectedType = type;
    this.currentPage = 1;
    this.loadProducts();
  }

  toggleLowStock(): void {
    this.lowStockOnly = !this.lowStockOnly;
    this.currentPage = 1;
    this.loadProducts();
  }
  loadProducts(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.inventoryService.getProducts(this.searchQuery, this.selectedType, this.lowStockOnly, this.currentPage, this.pageSize).subscribe({
      next: (res: any) => {
        this.products = res.data || [];
        this.totalData = res.pageResponse?.total || 0;
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

  openProductDetail(product: Product): void {
    const dialogRef = this.dialog.open(ProductDetailDialogComponent, {
      width: '760px',
      disableClose: false,
      data: { product, initialTab: 0, mode: 'view' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.reload) {
        this.loadProducts();
      }
    });
  }

  getStockStatus(p: Product): 'danger' | 'warning' | 'success' {
    if (p.itemType === 'SRV') return 'success';
    if (!p.stockQuantity || p.stockQuantity <= 0) return 'danger';
    if (p.stockQuantity <= (p.minStockLimit ?? 5)) return 'warning';
    return 'success';
  }
  getInitials(name: string): string {
    if (!name) return 'P';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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
    const dialogRef = this.dialog.open(ProductDetailDialogComponent, {
      width: '760px',
      disableClose: false,
      data: { product, initialTab: 1, mode: 'edit' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.reload) {
        this.loadProducts();
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
            this.loadProducts();
          },
          error: () => {
            this.snackBar.open('Gagal menghapus item', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadProducts();
  }
}
