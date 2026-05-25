import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ExpenseDialogData {
  mode: 'add';
}

@Component({
  selector: 'app-expense-dialog',
  templateUrl: '../views/expense-dialog.html',
  standalone: false
})
export class ExpenseDialogComponent implements OnInit {
  expenseForm!: FormGroup;
  isSaving = false;

  categories: { value: string; label: string }[] = [];

  allCategories: { [key: string]: { value: string; label: string }[] } = {
    EXP: [
      { value: 'SALARY', label: 'Gaji Karyawan' },
      { value: 'ELECTRICITY', label: 'Listrik & Air' },
      { value: 'STOCK', label: 'Pembelian Stok' },
      { value: 'RENT', label: 'Sewa Tempat' },
      { value: 'OTHER', label: 'Lain-lain' }
    ],
    INC: [
      { value: 'SERVICE', label: 'Pemasukan Jasa' },
      { value: 'OTHER', label: 'Lain-lain' }
    ]
  };

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ExpenseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExpenseDialogData
  ) {}

  ngOnInit(): void {
    // Current date formatted as YYYY-MM-DD
    const today = new Date();
    
    this.expenseForm = this.fb.group({
      cashflowType: ['EXP', [Validators.required]],
      amount: [null, [Validators.required, Validators.min(1)]],
      category: ['OTHER', [Validators.required]],
      flowDate: [today, [Validators.required]],
      description: [null]
    });

    this.updateCategories('EXP');

    // Watch type change to update categories
    this.expenseForm.get('cashflowType')?.valueChanges.subscribe(type => {
      this.updateCategories(type);
    });
  }

  updateCategories(type: string): void {
    this.categories = this.allCategories[type] || [];
    const currentCategory = this.expenseForm.get('category')?.value;
    // Reset category if not available in new list
    if (!this.categories.find(c => c.value === currentCategory)) {
      this.expenseForm.get('category')?.setValue(this.categories[0]?.value || 'OTHER');
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    const val = this.expenseForm.value;
    
    // Format date nicely to YYYY-MM-DD
    let flowDateStr = '';
    if (val.flowDate) {
      const d = new Date(val.flowDate);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      flowDateStr = `${year}-${month}-${day}`;
    }

    const payload = {
      cashflowType: val.cashflowType,
      amount: val.amount,
      category: val.category,
      flowDate: flowDateStr,
      description: val.description || ''
    };

    this.dialogRef.close(payload);
  }
}
