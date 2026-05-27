import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReportsService } from '../services/reports.service';
import { ReportFinanceSummary, ReportChartItem, ExpenseCategoryBreakdown } from '../models/reports.model';

@Component({
  selector: 'app-reports',
  templateUrl: '../views/reports.html',
  standalone: false
})
export class ReportsComponent implements OnInit {
  summary: ReportFinanceSummary = {
    totalIncome: 0,
    totalExpense: 0,
    netCashflow: 0,
    grossProfit: 0,
    totalServiceRevenue: 0,
    totalSparepartSales: 0,
    totalSparepartCOGS: 0
  };

  chartItems: ReportChartItem[] = [];
  expensesBreakdown: ExpenseCategoryBreakdown[] = [];
  
  loading = false;
  chartLoading = false;
  expensesLoading = false;
  maxChartVal = 100000;
  totalExpensesAmount = 0;
  
  // Financial P&L calculations
  netOperatingProfit = 0;
  profitMarginPercentage = 0;

  // Filters / Toggles
  chartPeriod: 'daily' | 'monthly' = 'monthly';
  currentDate = new Date();

  categoryMap: { [key: string]: { label: string; color: string } } = {
    SALARY: { label: 'Gaji Karyawan', color: '#3b82f6' },      // Blue
    ELECTRICITY: { label: 'Listrik & Air', color: '#10b981' }, // Emerald
    RENT: { label: 'Sewa Tempat', color: '#f59e0b' },          // Amber
    STOCK: { label: 'Pembelian Stok', color: '#ec4899' },      // Pink
    OTHER: { label: 'Lain-lain', color: '#8b5cf6' }            // Violet
  };

  constructor(
    private reportsService: ReportsService,
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
    this.loadChartData();
    this.loadExpensesAndBreakdown();
  }

  loadSummary(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.reportsService.getFinanceSummary().subscribe({
      next: (data) => {
        if (data) {
          this.summary = data;
          this.calculatePLMetrics();
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load reports summary:', err);
        this.snackBar.open('Gagal memuat ringkasan laporan keuangan', 'Tutup', { duration: 3000 });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadChartData(): void {
    this.chartLoading = true;
    this.cdr.detectChanges();

    this.reportsService.getChartData(this.chartPeriod).subscribe({
      next: (data) => {
        this.chartItems = data || [];
        this.calculateMaxChartVal();
        this.chartLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load reports chart data:', err);
        this.chartLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadExpensesAndBreakdown(): void {
    this.expensesLoading = true;
    this.cdr.detectChanges();

    this.reportsService.getExpenses().subscribe({
      next: (cashflows) => {
        this.processExpensesBreakdown(cashflows || []);
        this.expensesLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load expenses list:', err);
        this.expensesLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  processExpensesBreakdown(cashflows: any[]): void {
    // 1. Group by category and sum amounts
    const groups: { [key: string]: number } = {};
    let total = 0;

    cashflows.forEach(cf => {
      if (cf.cashflowType === 'EXP') {
        const cat = cf.category || 'OTHER';
        groups[cat] = (groups[cat] || 0) + cf.amount;
        total += cf.amount;
      }
    });

    this.totalExpensesAmount = total;

    // 2. Generate initial breakdown items
    const rawBreakdown: ExpenseCategoryBreakdown[] = Object.keys(groups).map(cat => {
      const amount = groups[cat];
      const percentage = total > 0 ? (amount / total) * 100 : 0;
      const mapping = this.categoryMap[cat] || { label: cat, color: '#94a3b8' };
      return {
        category: cat,
        label: mapping.label,
        amount: amount,
        percentage: percentage,
        color: mapping.color
      };
    });

    // Sort by amount descending
    rawBreakdown.sort((a, b) => b.amount - a.amount);

    // 3. Calculate SVG Donut segment properties
    let accumulatedPercent = 0;
    this.expensesBreakdown = rawBreakdown.map(item => {
      // Stroke dasharray: percentage portion, gap portion
      const strokeDashArray = `${item.percentage.toFixed(4)} ${(100 - item.percentage).toFixed(4)}`;
      // Stroke dashoffset: starting point of segment. SVG starts at 3 o'clock (0 percent).
      // We offset by accumulated percentage to layer segments contiguously.
      const strokeDashOffset = 100 - accumulatedPercent + 25; // 25 unit shift rotates start to 12 o'clock
      
      accumulatedPercent += item.percentage;

      return {
        ...item,
        strokeDashArray,
        strokeDashOffset
      };
    });

    this.calculatePLMetrics();
  }

  calculatePLMetrics(): void {
    // Standard P&L Calculations
    // Laba Bersih Operasional = Laba Kotor - Beban Operasional (Gaji, Listrik, Sewa, Stok PO, Lainnya)
    // Note: in this system, summary.totalExpense accumulates all cashflow EXP.
    this.netOperatingProfit = this.summary.grossProfit - this.totalExpensesAmount;
    
    // Revenue = Jasa Servis + Penjualan Sparepart
    const totalRevenue = this.summary.totalServiceRevenue + this.summary.totalSparepartSales;
    this.profitMarginPercentage = totalRevenue > 0 ? (this.netOperatingProfit / totalRevenue) * 100 : 0;
  }

  calculateMaxChartVal(): void {
    if (this.chartItems.length === 0) {
      this.maxChartVal = 100000;
      return;
    }
    const max = Math.max(...this.chartItems.map(item => Math.max(item.income, item.expense)));
    this.maxChartVal = max > 0 ? max * 1.15 : 100000; // add 15% padding
  }

  changeChartPeriod(period: 'daily' | 'monthly'): void {
    this.chartPeriod = period;
    this.loadChartData();
  }

  // Visual SVG chart helpers
  getBarHeight(val: number): number {
    if (this.maxChartVal === 0) return 0;
    return (val / this.maxChartVal) * 80; // 80 units max in SVG
  }

  getChartLabelShort(label: string): string {
    if (!label) return '';
    if (label.length === 10) { // YYYY-MM-DD
      return label.substring(8, 10) + '/' + label.substring(5, 7);
    } else if (label.length === 7) { // YYYY-MM
      const parts = label.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthIdx = parseInt(parts[1], 10) - 1;
      return monthNames[monthIdx] + ' ' + parts[0].substring(2, 4);
    }
    return label;
  }

  printReport(): void {
    window.print();
  }
}
