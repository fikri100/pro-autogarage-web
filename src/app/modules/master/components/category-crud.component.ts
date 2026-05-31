import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MasterService } from '../master.service';
import { Category } from '../models/master.model';

@Component({
  selector: 'app-category-crud',
  templateUrl: '../views/category-crud.html',
  standalone: false
})
export class CategoryCrudComponent implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  categoryForm!: FormGroup;
  loading = false;
  isSaving = false;
  isEditMode = false;
  editingCategoryId: number | null = null;
  displayedColumns: string[] = ['id', 'name', 'actions'];

  constructor(
    private fb: FormBuilder,
    private api: MasterService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
  }

  private initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]]
    });
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

  selectForEdit(category: Category): void {
    this.isEditMode = true;
    this.editingCategoryId = category.id!;
    this.categoryForm.patchValue({
      name: category.name
    });
    this.cdr.detectChanges();
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.editingCategoryId = null;
    this.categoryForm.reset();
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) return;
    this.isSaving = true;
    this.cdr.detectChanges();

    const payload: Category = {
      name: this.categoryForm.value.name
    };

    if (this.isEditMode && this.editingCategoryId !== null) {
      this.api.updateCategory(this.editingCategoryId, payload).subscribe({
        next: () => {
          this.snackBar.open('Kategori berhasil diperbarui!', 'OK', { duration: 3000, panelClass: 'snack-success' });
          this.isSaving = false;
          this.cancelEdit();
          this.loadCategories();
        },
        error: (err) => {
          this.snackBar.open('Gagal memperbarui kategori', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.api.createCategory(payload).subscribe({
        next: () => {
          this.snackBar.open('Kategori baru berhasil ditambahkan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
          this.isSaving = false;
          this.categoryForm.reset();
          this.loadCategories();
        },
        error: (err) => {
          this.snackBar.open('Gagal menambahkan kategori baru', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteCategory(category: Category): void {
    if (confirm(`Apakah Anda yakin ingin menghapus kategori "${category.name}"?`)) {
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
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredCategories = this.categories.filter(c => 
      c.name.toLowerCase().includes(filterValue) ||
      (c.id && c.id.toString().includes(filterValue))
    );
  }
}
