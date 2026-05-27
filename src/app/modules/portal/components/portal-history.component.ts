import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PortalService } from '../services/portal.service';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog.component';

@Component({
  selector: 'app-portal-history',
  templateUrl: '../views/portal-history.html',
  standalone: false
})
export class PortalHistoryComponent implements OnInit {
  bookings: any[] = [];
  loading = false;
  customerName = '';

  statusMap: { [key: string]: { label: string; color: string; desc: string } } = {
    PENDING: { 
      label: 'Menunggu Persetujuan', 
      color: '#d97706', // Amber
      desc: 'Pengajuan Anda sedang ditinjau oleh Admin kami.' 
    },
    CONFIRMED: { 
      label: 'Disetujui / Aktif', 
      color: '#0284c7', // Blue
      desc: 'Reservasi disetujui! Mobil Anda telah masuk antrean pengerjaan teknisi.' 
    },
    CANCELLED: { 
      label: 'Dibatalkan', 
      color: '#ef4444', // Red
      desc: 'Jadwal reservasi ini telah dibatalkan.' 
    }
  };

  constructor(
    private portalService: PortalService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const customer = this.portalService.currentCustomer;
    if (!customer) {
      this.router.navigate(['/portal/login']);
      return;
    }
    this.customerName = customer.name;
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    this.cdr.detectChanges();
    
    this.portalService.getBookings().subscribe({
      next: (data) => {
        this.bookings = data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load portal bookings:', err);
        this.snackBar.open('Gagal memuat riwayat booking!', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getStatusDetails(status: string): { label: string; color: string; desc: string } {
    return this.statusMap[status] || { label: status, color: '#64748b', desc: '' };
  }

  onCancelBooking(id: number): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '440px',
      data: {
        title: 'Batalkan Reservasi',
        message: 'Apakah Anda yakin ingin membatalkan reservasi ini?',
        confirmText: 'Batalkan',
        cancelText: 'Batal',
        warn: true
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.loading = true;
        this.cdr.detectChanges();
        this.portalService.cancelBooking(id).subscribe({
          next: () => {
            this.snackBar.open('Reservasi berhasil dibatalkan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadBookings();
          },
          error: (err) => {
            console.error('Failed to cancel booking:', err);
            let errMsg = 'Gagal membatalkan reservasi!';
            if (err.error && err.error.error) {
              errMsg = err.error.error;
            }
            this.snackBar.open(errMsg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }
}
