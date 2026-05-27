import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog.component';

import { FinanceService } from '../services/finance.service';
import { ExpenseDialogComponent } from './expense-dialog.component';
import { Cashflow, FinanceSummary, FinanceChartItem } from '../models/finance.model';

@Component({
  selector: 'app-finance-dashboard',
  templateUrl: '../views/finance.html',
  standalone: false
})
export class FinanceComponent implements OnInit {
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

  // Filters
  filterType: '' | 'INC' | 'EXP' = '';
  filterCategory = '';
  filterStartDate = '';
  filterEndDate = '';
  chartPeriod: 'daily' | 'monthly' = 'daily';

  displayedColumns = ['flowDate', 'cashflowType', 'category', 'amount', 'description', 'actions'];

  categoryMap: { [key: string]: string } = {
    SALARY: 'Gaji Karyawan',
    ELECTRICITY: 'Listrik & Air',
    STOCK: 'Stok Sparepart',
    RENT: 'Sewa Tempat',
    SERVICE: 'Pemasukan Servis',
    OTHER: 'Lain-lain'
  };

  constructor(
    private financeService: FinanceService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.loadAllData();
    });
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
      endDate: formatFilterDate(this.filterEndDate) || undefined
    };

    this.financeService.getCashflows(filters).subscribe({
      next: (data) => {
        this.cashflows = data || [];
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
    this.loadCashflows();
  }

  resetFilters(): void {
    this.filterType = '';
    this.filterCategory = '';
    this.filterStartDate = '';
    this.filterEndDate = '';
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
