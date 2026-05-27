import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { BookingService } from '../booking.service';
import { Booking } from '../models/object';
import { BookingDialogComponent } from './booking-dialog.component';

@Component({
  selector: 'app-booking-list',
  templateUrl: '../views/booking.html',
  standalone: false
})
export class BookingComponent implements OnInit {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  loading = false;

  selectedStatus: 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' = 'ALL';
  searchQuery = '';

  constructor(
    private bookingService: BookingService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    this.cdr.detectChanges();

    const apiStatus = this.selectedStatus === 'ALL' ? '' : this.selectedStatus;
    this.bookingService.getBookings(apiStatus).subscribe({
      next: (data: Booking[]) => {
        this.bookings = (data || []).sort((a, b) => {
          const statusA = (a.status || '').toUpperCase();
          const statusB = (b.status || '').toUpperCase();
          if (statusA === 'PENDING' && statusB !== 'PENDING') return -1;
          if (statusA !== 'PENDING' && statusB === 'PENDING') return 1;
          
          const idA = a.id || 0;
          const idB = b.id || 0;
          return idB - idA;
        });
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading bookings:', err);
        this.snackBar.open('Gagal memuat data booking', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    if (!this.searchQuery) {
      this.filteredBookings = this.bookings;
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredBookings = this.bookings.filter(b => 
        (b.customerName?.toLowerCase().includes(q)) ||
        (b.licensePlate?.toLowerCase().includes(q)) ||
        (b.vehicleBrand?.toLowerCase().includes(q)) ||
        (b.vehicleModel?.toLowerCase().includes(q))
      );
    }
  }

  onSearchChange(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.applyFilter();
  }

  filterByStatus(status: 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'): void {
    this.selectedStatus = status;
    this.loadBookings();
  }

  getInitials(name: string): string {
    if (!name) return 'B';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  showAddModal(): void {
    const dialogRef = this.dialog.open(BookingDialogComponent, {
      width: '620px',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.bookingService.createBooking(result).subscribe({
          next: () => {
            this.snackBar.open('Booking berhasil ditambahkan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadBookings();
          },
          error: () => {
            this.snackBar.open('Gagal menambahkan booking', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }

  confirmBooking(booking: Booking): void {
    const dialogRef = this.dialog.open(BookingDialogComponent, {
      width: '420px',
      data: { 
        mode: 'confirm', 
        message: `Konfirmasi booking atas nama "${booking.customerName}" untuk mobil "${booking.licensePlate}"?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.bookingService.confirmBooking(booking.id!).subscribe({
          next: () => {
            this.snackBar.open('Booking dikonfirmasi & tiket Work Order terbuat!', 'OK', { duration: 4000, panelClass: 'snack-success' });
            this.loadBookings();
          },
          error: () => {
            this.snackBar.open('Gagal mengonfirmasi booking', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }

  cancelBooking(booking: Booking): void {
    const dialogRef = this.dialog.open(BookingDialogComponent, {
      width: '400px',
      data: { 
        mode: 'cancel', 
        message: `Apakah Anda yakin ingin membatalkan booking atas nama "${booking.customerName}"?`
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.bookingService.cancelBooking(booking.id!).subscribe({
          next: () => {
            this.snackBar.open('Booking berhasil dibatalkan', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadBookings();
          },
          error: () => {
            this.snackBar.open('Gagal membatalkan booking', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }
}
