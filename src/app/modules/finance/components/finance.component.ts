import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Observable, Subject, Subscription } from 'rxjs';
import { map, startWith, debounceTime } from 'rxjs/operators';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog.component';

import { FinanceService } from '../services/finance.service';
import { ExpenseDialogComponent } from './expense-dialog.component';
import { Cashflow, FinanceSummary, FinanceChartItem } from '../models/finance.model';

@Component({
  selector: 'app-finance-dashboard',
  templateUrl: '../views/finance.html',
  standalone: false
})
export class FinanceComponent implements OnInit, OnDestroy {
  summary: FinanceSummary = {
    totalIncome: 0,
    totalExpense: 0,
    netCashflow: 0,
    grossProfit: 0,
    totalServiceRevenue: 0,
    totalSparepartSales: 0,
    totalSparepartCOGS: 0
  };

  cashflows: Cashflow[] = [];
  chartItems: FinanceChartItem[] = [];
  loading = false;
  chartLoading = false;
  maxChartVal = 100000;

  totalData = 0;
  currentPage = 1;
  pageSize = 10;
  searchQuery = '';
  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  // Filters
  filterType: '' | 'INC' | 'EXP' = '';
  filterCategory = '';
  filterStartDate = '';
  filterEndDate = '';
  chartPeriod: 'daily' | 'monthly' = 'daily';

  filterTypeControl = new FormControl('');
  filterCategoryControl = new FormControl('');
  
  filteredTypeOptions$!: Observable<any[]>;
  filteredCategoryOptions$!: Observable<any[]>;

  typeOptions: { value: string; label: string }[] = [{ value: '', label: 'Semua Tipe' }];
  categoryOptions: { value: string; label: string }[] = [{ value: '', label: 'Semua Kategori' }];
  displayedColumns = ['flowDate', 'cashflowType', 'category', 'amount', 'description', 'actions'];
  categoryMap: { [key: string]: string } = {};

  constructor(
    private financeService: FinanceService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(1000)
    ).subscribe(searchValue => {
      this.searchQuery = searchValue;
      this.currentPage = 1;
      this.loadCashflows();
    });
    this.financeService.getParamsByGroup('CASHFLOW_TYPE').subscribe(typeData => {
      const dbTypes = (typeData || []).map(p => ({
        value: p.kode_param,
        label: p.kode_param === 'INC' ? 'Pemasukan (Kas Masuk)' : p.kode_param === 'EXP' ? 'Pengeluaran (Kas Keluar)' : p.nama_param
      }));
      this.typeOptions = [
        { value: '', label: 'Semua Tipe' },
        ...dbTypes
      ];

      this.financeService.getParamsByGroup('CASHFLOW_CATEGORY').subscribe(catData => {
        const dbCats = (catData || []).map(p => ({
          value: p.kode_param,
          label: p.nama_param
        }));
        this.categoryOptions = [
          { value: '', label: 'Semua Kategori' },
          ...dbCats
        ];
        
        // Build categoryMap dynamically
        const newMap: { [key: string]: string } = {};
        (catData || []).forEach(p => {
          newMap[p.kode_param] = p.nama_param;
        });
        this.categoryMap = newMap;

        this.setupAutocomplete();
        this.loadAllData();
      });
    });
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  setupAutocomplete(): void {
    this.filteredTypeOptions$ = this.filterTypeControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : (this.getTypeLabel(value || '') || '');
        return name ? this.typeOptions.filter(t => t.label.toLowerCase().includes(name.toLowerCase())) : this.typeOptions.slice();
      })
    );

    this.filteredCategoryOptions$ = this.filterCategoryControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : (this.getCategoryOptionLabel(value || '') || '');
        return name ? this.categoryOptions.filter(c => c.label.toLowerCase().includes(name.toLowerCase())) : this.categoryOptions.slice();
      })
    );

    this.filterTypeControl.valueChanges.subscribe(val => {
       if (typeof val === 'string' && val.length > 0 && val !== 'INC' && val !== 'EXP') return;
       this.filterType = val as any;
       this.onFilterChange();
    });

    this.filterCategoryControl.valueChanges.subscribe(val => {
       if (typeof val === 'string' && val.length > 0 && !this.categoryOptions.find(c => c.value === val)) return;
       this.filterCategory = val || '';
       this.onFilterChange();
    });
  }

  getTypeLabel(value: string): string {
    const t = this.typeOptions.find(o => o.value === value);
    return t ? t.label : value;
  }

  displayType = (value: string): string => {
    return this.getTypeLabel(value);
  }

  getCategoryOptionLabel(value: string): string {
    const c = this.categoryOptions.find(o => o.value === value);
    return c ? c.label : value;
  }

  displayCategory = (value: string): string => {
    return this.getCategoryOptionLabel(value);
  }

  loadAllData(): void {
    this.loadSummary();
    this.loadCashflows();
    this.loadChartData();
  }

  loadSummary(): void {
    this.financeService.getFinanceSummary().subscribe({
      next: (data) => {
        this.summary = data || this.summary;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load summary:', err);
        this.snackBar.open('Gagal memuat ringkasan keuangan', 'Tutup', { duration: 3000 });
      }
    });
  }

  loadCashflows(): void {
    this.loading = true;
    this.cdr.detectChanges();

    const formatFilterDate = (val: any) => {
      if (val instanceof Date) {
        const year = val.getFullYear();
        const month = String(val.getMonth() + 1).padStart(2, '0');
        const day = String(val.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return val;
    };

    const filters = {
      type: this.filterType || undefined,
      category: this.filterCategory || undefined,
      startDate: formatFilterDate(this.filterStartDate) || undefined,
      endDate: formatFilterDate(this.filterEndDate) || undefined,
      search: this.searchQuery || undefined,
      page: this.currentPage,
      limit: this.pageSize
    };

    this.financeService.getCashflows(filters).subscribe({
      next: (res: any) => {
        this.cashflows = res.data || [];
        this.totalData = res.pageResponse?.total || 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load cashflows:', err);
        this.snackBar.open('Gagal memuat daftar kasir', 'Tutup', { duration: 3000 });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadChartData(): void {
    this.chartLoading = true;
    this.cdr.detectChanges();

    this.financeService.getChartData(this.chartPeriod).subscribe({
      next: (data) => {
        this.chartItems = data || [];
        this.calculateMaxChartVal();
        this.chartLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load chart data:', err);
        this.chartLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateMaxChartVal(): void {
    if (this.chartItems.length === 0) {
      this.maxChartVal = 100000;
      return;
    }
    const max = Math.max(...this.chartItems.map(item => Math.max(item.income, item.expense)));
    this.maxChartVal = max > 0 ? max * 1.15 : 100000; // add 15% padding
  }

  getCategoryLabel(cat: string): string {
    return this.categoryMap[cat] || cat;
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadCashflows();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchSubject.next(filterValue);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadCashflows();
  }

  resetFilters(): void {
    this.filterType = '';
    this.filterCategory = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
    this.searchQuery = '';
    this.currentPage = 1;
    this.filterTypeControl.setValue('', { emitEvent: false });
    this.filterCategoryControl.setValue('', { emitEvent: false });
    this.loadCashflows();
  }

  changeChartPeriod(period: 'daily' | 'monthly'): void {
    this.chartPeriod = period;
    this.loadChartData();
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(ExpenseDialogComponent, {
      width: '500px',
      disableClose: true,
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.financeService.createCashflow(result).subscribe({
          next: () => {
            this.snackBar.open('Transaksi berhasil disimpan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadAllData();
          },
          error: (err) => {
            console.error('Failed to save cashflow:', err);
            const msg = err.error || 'Gagal menyimpan transaksi kas';
            this.snackBar.open(msg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }

  deleteCashflow(cf: Cashflow): void {
    if (cf.transactionId) {
      this.snackBar.open('Tidak bisa menghapus transaksi otomatis dari kasir', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '440px',
      data: {
        title: 'Hapus Pencatatan Kas',
        message: `Apakah Anda yakin ingin menghapus pencatatan kas ${this.getCategoryLabel(cf.category)} sebesar Rp ${cf.amount.toLocaleString('id-ID')}?`,
        confirmText: 'Hapus',
        cancelText: 'Batal',
        warn: true
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.financeService.deleteCashflow(cf.id!).subscribe({
          next: () => {
            this.snackBar.open('Pencatatan kas berhasil dihapus', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadAllData();
          },
          error: (err) => {
            console.error('Failed to delete cashflow:', err);
            const msg = err.error || 'Gagal menghapus transaksi';
            this.snackBar.open(msg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }

  // Visual helper functions for SVG Chart
  getBarHeight(val: number): number {
    if (this.maxChartVal === 0) return 0;
    return (val / this.maxChartVal) * 80; // chart height is 80 units in SVG
  }

  getBarY(val: number): number {
    return 90 - this.getBarHeight(val); // 90 is base line in SVG
  }

  getChartLabelShort(label: string): string {
    if (!label) return '';
    // Format daily YYYY-MM-DD to DD/MM or monthly YYYY-MM to MM/YY
    if (label.length === 10) {
      return label.substring(8, 10) + '/' + label.substring(5, 7);
    } else if (label.length === 7) {
      const parts = label.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthIdx = parseInt(parts[1], 10) - 1;
      return monthNames[monthIdx] + ' ' + parts[0].substring(2, 4);
    }
    return label;
  }
}
