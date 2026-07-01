import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Category } from '../models/master.model';
import { MasterService } from '../master.service';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog.component';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

export interface CategoryDetailData {
  mode: 'add' | 'edit';
  category?: Category;
}

@Component({
  selector: 'app-category-detail',
  templateUrl: '../views/category-detail.html',
  standalone: false
})
export class CategoryDetailComponent implements OnInit {
  categoryForm!: FormGroup;
  isSaving = false;

  itemTypes: any[] = [];
  filteredItemTypes$!: Observable<any[]>;

  constructor(
    private fb: FormBuilder,
    private api: MasterService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<CategoryDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CategoryDetailData
  ) { }

  ngOnInit(): void {
    this.categoryForm = this.fb.group({
      name: [this.data.category?.name || '', [Validators.required, Validators.minLength(3)]],
      itemTypeId: [this.data.category?.itemTypeId || '', [Validators.required]]
    });

    this.api.getParamsByGroup('ITEM_TYPE').subscribe(typeData => {
      this.itemTypes = (typeData || []).map(t => ({
        value: t.id,
        label: t.nama_param
      }));
      this.setupAutocomplete();

      if (this.data.category?.itemTypeId) {
        this.categoryForm.get('itemTypeId')?.setValue(this.data.category.itemTypeId);
      }
    });
  }

  setupAutocomplete(): void {
    this.filteredItemTypes$ = this.categoryForm.get('itemTypeId')!.valueChanges.pipe(
      startWith(this.categoryForm.get('itemTypeId')!.value || ''),
      map(value => {
        const name = typeof value === 'string' ? value : (this.getItemTypeLabel(value) || '');
        return name ? this.itemTypes.filter(t => t.label.toLowerCase().includes(name.toLowerCase())) : this.itemTypes.slice();
      })
    );
  }

  getItemTypeLabel(value: any): string {
    const t = this.itemTypes.find(o => o.value === Number(value));
    return t ? t.label : String(value);
  }

  displayItemType = (value: any): string => {
    return this.getItemTypeLabel(value);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '440px',
      data: {
        title: this.data.mode === 'add' ? 'Simpan Kategori' : 'Perbarui Kategori',
        message: this.data.mode === 'add' 
          ? 'Apakah Anda yakin ingin menyimpan kategori baru ini?' 
          : 'Apakah Anda yakin ingin memperbarui data kategori ini?',
        confirmText: 'Simpan',
        cancelText: 'Batal',
        warn: false
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.dialogRef.close(this.categoryForm.value);
      }
    });
  }
}
