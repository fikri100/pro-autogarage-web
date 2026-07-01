import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../master.service';
import { Category } from '../models/master.model';
import { CategoryDetailComponent } from './category-detail.component';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog.component';

@Component({
  selector: 'app-category-crud',
  templateUrl: '../views/category-crud.html',
  standalone: false
})
export class CategoryCrudComponent implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  loading = false;
  displayedColumns: string[] = ['id', 'name', 'itemType', 'actions'];

  constructor(
    private api: MasterService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  getItemTypeLabel(typeId?: number): string {
    if (typeId === 3) return 'Sparepart';
    if (typeId === 4) return 'Jasa/Service';
    return typeId ? typeId.toString() : '-';
  }

  loadCategories(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.api.getCategories().subscribe({
      next: (data) => {
        this.categories = data || [];
        this.filteredCategories = [...this.categories];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Gagal memuat data kategori', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  showAddDialog(): void {
    const dialogRef = this.dialog.open(CategoryDetailComponent, {
      width: '450px',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.cdr.detectChanges();
        this.api.createCategory(result).subscribe({
          next: () => {
            this.snackBar.open('Kategori baru berhasil ditambahkan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadCategories();
          },
          error: () => {
            this.snackBar.open('Gagal menambahkan kategori baru', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  showEditDialog(category: Category): void {
    const dialogRef = this.dialog.open(CategoryDetailComponent, {
      width: '450px',
      data: { mode: 'edit', category }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.cdr.detectChanges();
        this.api.updateCategory(category.id!, result).subscribe({
          next: () => {
            this.snackBar.open('Kategori berhasil diperbarui!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadCategories();
          },
          error: () => {
            this.snackBar.open('Gagal memperbarui kategori', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  deleteCategory(category: Category): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '440px',
      data: {
        title: 'Hapus Kategori',
        message: `Apakah Anda yakin ingin menghapus kategori "${category.name}"?`,
        confirmText: 'Hapus',
        cancelText: 'Batal',
        warn: true
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.api.deleteCategory(category.id!).subscribe({
          next: () => {
            this.snackBar.open('Kategori berhasil dihapus!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadCategories();
          },
          error: () => {
            this.snackBar.open('Gagal menghapus kategori', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredCategories = this.categories.filter(c => 
      c.name.toLowerCase().includes(filterValue) ||
      (c.itemTypeId && c.itemTypeId.toString().includes(filterValue)) ||
      (c.itemTypeName && c.itemTypeName.toLowerCase().includes(filterValue)) ||
      (c.id && c.id.toString().includes(filterValue))
    );
  }
}
