import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { Observable, Subject, Subscription } from 'rxjs';
import { map, startWith, debounceTime } from 'rxjs/operators';

import { BookingService } from '../booking.service';
import { Booking } from '../models/object';
import { BookingDialogComponent } from './booking-dialog.component';

@Component({
  selector: 'app-booking-list',
  templateUrl: '../views/booking.html',
  standalone: false
})
export class BookingComponent implements OnInit, OnDestroy {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  loading = false;

  totalData = 0;
  currentPage = 1;
  pageSize = 10;
  searchQuery = '';
  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  selectedStatus: 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' = 'ALL';

  statusControl = new FormControl('ALL');
  statusOptions = [
    { value: 'ALL', label: 'Semua Status' },
    { value: 'PENDING', label: 'Menunggu Konfirmasi' },
    { value: 'CONFIRMED', label: 'Dikonfirmasi' },
    { value: 'CANCELLED', label: 'Dibatalkan' }
  ];

  constructor(
    private bookingService: BookingService,
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
      this.loadBookings();
    });
    this.setupAutocomplete();
    this.loadBookings();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  setupAutocomplete() {
    this.statusControl.valueChanges.subscribe(val => {
       if (val) {
         this.filterByStatus(val as any);
       }
    });
  }

  loadBookings(): void {
    this.loading = true;
    this.cdr.detectChanges();

    const apiStatus = this.selectedStatus === 'ALL' ? '' : this.selectedStatus;
    this.bookingService.getBookings(this.searchQuery, apiStatus, this.currentPage, this.pageSize).subscribe({
      next: (res: any) => {
        this.bookings = res.data || [];
        this.totalData = res.pageResponse?.total || 0;
        this.filteredBookings = [...this.bookings];
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

  onSearchChange(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchSubject.next(filterValue);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadBookings();
  }

  filterByStatus(status: 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'): void {
    this.selectedStatus = status;
    this.currentPage = 1;
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
