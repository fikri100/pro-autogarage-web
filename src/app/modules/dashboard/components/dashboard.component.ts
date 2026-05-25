import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DashboardService } from '../services/dashboard.service';
import { DashboardSummary } from '../models/dashboard.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: '../views/dashboard.html',
  standalone: false
})
export class DashboardComponent implements OnInit, OnDestroy {
  summary: DashboardSummary = {
    stats: {
      totalCustomers: 0,
      activeWorkOrders: 0,
      todayRevenue: 0,
      pendingBookings: 0
    },
    recentBookings: [],
    activeWorkOrders: []
  };

  loading = false;
  actionLoading = false;
  private refreshInterval: any;

  bookingColumns = ['time', 'customer', 'vehicle', 'complaints', 'actions'];
  woColumns = ['plate', 'vehicle', 'mechanic', 'status', 'progress'];

  statusMap: { [key: string]: { label: string; color: string } } = {
    IN_PROGRESS: { label: 'Sedang Dikerjakan', color: '#3b82f6' }, // Blue
    COMPLETED: { label: 'Selesai Servis', color: '#10b981' },     // Green
    PAID: { label: 'Sudah Lunas', color: '#64748b' }               // Gray
  };

  constructor(
    private dashboardService: DashboardService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.loadSummary();
    });

    // Auto refresh dashboard every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.loadSummary(true); // silent reload
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  loadSummary(silent = false): void {
    if (!silent) {
      this.loading = true;
      this.cdr.detectChanges();
    }

    this.dashboardService.getSummary().subscribe({
      next: (data) => {
        this.summary = data || this.summary;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load dashboard summary:', err);
        if (!silent) {
          this.snackBar.open('Gagal memuat ringkasan dashboard', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  approveBooking(booking: any): void {
    if (confirm(`Apakah Anda yakin ingin menyetujui reservasi dari ${booking.customerName} (Plat: ${booking.licensePlate})?\nHal ini akan otomatis membuat perintah kerja (Work Order) baru.`)) {
      this.actionLoading = true;
      this.cdr.detectChanges();

      this.dashboardService.approveBooking(booking.id).subscribe({
        next: () => {
          this.snackBar.open('Booking berhasil disetujui! Work Order aktif telah dibuat.', 'OK', { duration: 3000, panelClass: 'snack-success' });
          this.loadSummary();
          this.actionLoading = false;
        },
        error: (err) => {
          console.error('Failed to approve booking:', err);
          const msg = err.error || 'Gagal menyetujui booking';
          this.snackBar.open(msg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          this.actionLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  cancelBooking(booking: any): void {
    if (confirm(`Apakah Anda yakin ingin membatalkan reservasi dari ${booking.customerName} (Plat: ${booking.licensePlate})?`)) {
      this.actionLoading = true;
      this.cdr.detectChanges();

      this.dashboardService.cancelBooking(booking.id).subscribe({
        next: () => {
          this.snackBar.open('Booking telah dibatalkan', 'OK', { duration: 3000, panelClass: 'snack-success' });
          this.loadSummary();
          this.actionLoading = false;
        },
        error: (err) => {
          console.error('Failed to cancel booking:', err);
          const msg = err.error || 'Gagal membatalkan booking';
          this.snackBar.open(msg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          this.actionLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  getStatusDetails(status: string): { label: string; color: string } {
    return this.statusMap[status] || { label: status, color: '#64748b' };
  }

  getWOProgress(status: string): number {
    if (status === 'COMPLETED') return 100;
    if (status === 'IN_PROGRESS') return 50;
    return 0;
  }
}
