import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Category } from '../models/master.model';

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

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CategoryDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CategoryDetailData
  ) {}

  ngOnInit(): void {
    this.categoryForm = this.fb.group({
      name: [this.data.category?.name || '', [Validators.required, Validators.minLength(3)]]
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.categoryForm.value);
  }
}
