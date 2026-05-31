import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

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

  cashflowTypes = [
    { value: 'EXP', label: 'Pengeluaran (Expense)' },
    { value: 'INC', label: 'Pemasukan (Income)' }
  ];
  filteredCashflowTypes$!: Observable<any[]>;
  filteredCategories$!: Observable<any[]>;

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
      cashflowType: [null, [Validators.required]],
      amount: [null, [Validators.required, Validators.min(1)]],
      category: [null, [Validators.required]],
      flowDate: [today, [Validators.required]],
      description: [null]
    });

    this.categories = [];

    // Watch type change to update categories
    this.expenseForm.get('cashflowType')?.valueChanges.subscribe(type => {
      if (type === 'EXP' || type === 'INC') {
        this.updateCategories(type);
      } else {
        this.categories = [];
        this.expenseForm.get('category')?.setValue(null);
      }
      this.expenseForm.get('category')?.updateValueAndValidity();
    });

    this.setupAutocomplete();
  }

  setupAutocomplete(): void {
    this.filteredCashflowTypes$ = this.expenseForm.get('cashflowType')!.valueChanges.pipe(
      startWith(this.expenseForm.get('cashflowType')!.value || ''),
      map(value => {
        const name = typeof value === 'string' ? value : (this.getCashflowLabel(value) || '');
        return name ? this.cashflowTypes.filter(t => t.label.toLowerCase().includes(name.toLowerCase())) : this.cashflowTypes.slice();
      })
    );

    this.filteredCategories$ = this.expenseForm.get('category')!.valueChanges.pipe(
      startWith(this.expenseForm.get('category')!.value || ''),
      map(value => {
        const name = typeof value === 'string' ? value : (this.getCategoryLabel(value) || '');
        return name ? this.categories.filter(c => c.label.toLowerCase().includes(name.toLowerCase())) : this.categories.slice();
      })
    );
  }

  getCashflowLabel(value: string): string {
    if (!value) return '';
    const type = this.cashflowTypes.find(t => t.value === value);
    return type ? type.label : value;
  }

  displayCashflowType = (value: string): string => {
    return this.getCashflowLabel(value);
  }

  getCategoryLabel(value: string): string {
    if (!value) return '';
    const cat = this.categories.find(c => c.value === value);
    return cat ? cat.label : value;
  }

  displayCategory = (value: string): string => {
    return this.getCategoryLabel(value);
  }

  updateCategories(type: string): void {
    this.categories = this.allCategories[type] || [];
    const currentCategory = this.expenseForm.get('category')?.value;
    // Reset category if not available in new list
    if (!currentCategory || !this.categories.find(c => c.value === currentCategory)) {
      this.expenseForm.get('category')?.setValue(null);
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
