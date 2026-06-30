import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { FinanceService } from '../services/finance.service';

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

  cashflowTypes: { value: string; label: string }[] = [];
  filteredCashflowTypes$!: Observable<any[]>;
  filteredCategories$!: Observable<any[]>;

  categories: { value: string; label: string }[] = [];

  allCategories: { [key: string]: { value: string; label: string }[] } = {
    EXP: [],
    INC: []
  };

  constructor(
    private fb: FormBuilder,
    private financeService: FinanceService,
    public dialogRef: MatDialogRef<ExpenseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExpenseDialogData
  ) {}

  ngOnInit(): void {
    const today = new Date();
    
    this.expenseForm = this.fb.group({
      cashflowType: [null, [Validators.required]],
      amount: [null, [Validators.required, Validators.min(1)]],
      category: [null, [Validators.required]],
      flowDate: [today, [Validators.required]],
      description: [null]
    });

    this.categories = [];

    this.financeService.getParamsByGroup('CASHFLOW_TYPE').subscribe(typeData => {
      this.cashflowTypes = (typeData || []).map(p => ({
        value: p.kode_param,
        label: p.kode_param === 'INC' ? 'Pemasukan (Income)' : p.kode_param === 'EXP' ? 'Pengeluaran (Expense)' : p.nama_param
      }));

      this.financeService.getParamsByGroup('CASHFLOW_CATEGORY').subscribe(catData => {
        const expList: { value: string; label: string }[] = [];
        const incList: { value: string; label: string }[] = [];

        (catData || []).forEach(p => {
          const item = { value: p.kode_param, label: p.nama_param };
          if (p.kode_param === 'SERVICE') {
            incList.push(item);
          } else if (p.kode_param === 'OTHER') {
            incList.push(item);
            expList.push(item);
          } else {
            expList.push(item);
          }
        });

        this.allCategories = {
          EXP: expList,
          INC: incList
        };

        // Watch type change to update categories
        this.expenseForm.get('cashflowType')?.valueChanges.subscribe(type => {
          if (type) {
            this.updateCategories(type);
          } else {
            this.categories = [];
            this.expenseForm.get('category')?.setValue(null);
          }
          this.expenseForm.get('category')?.updateValueAndValidity();
        });

        this.setupAutocomplete();
      });
    });
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
