import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { CustomerService } from '../customers.service';
import { Customer } from '../models/object';
import { CustomerDialogComponent } from './customer-dialog.component';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog.component';

@Component({
  selector: 'app-customer-list',
  templateUrl: '../views/customers.html',
  standalone: false
})
export class CustomersComponent implements OnInit, OnDestroy {
  customers: Customer[] = [];
  loading = false;

  totalData = 0;
  currentPage = 1;
  pageSize = 10;
  searchQuery = '';
  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  displayedColumns: string[] = ['id', 'name', 'phone', 'email', 'address', 'actions'];

  constructor(
    private customerService: CustomerService,
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
      this.loadCustomers();
    });
    this.loadCustomers();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  loadCustomers(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.customerService.getCustomers(this.searchQuery, this.currentPage, this.pageSize).subscribe({
      next: (res: any) => {
        this.customers = res.data || [];
        this.totalData = res.pageResponse?.total || 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading customers:', err);
        this.snackBar.open('Gagal memuat data pelanggan', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  showAddModal(): void {
    const dialogRef = this.dialog.open(CustomerDialogComponent, {
      width: '620px',
      disableClose: false,
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.customerService.createCustomer(result).subscribe({
          next: () => {
            this.snackBar.open('Pelanggan berhasil ditambahkan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadCustomers();
          },
          error: () => {
            this.snackBar.open('Gagal menambahkan pelanggan', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }

  showEditModal(customer: Customer): void {
    const dialogRef = this.dialog.open(CustomerDialogComponent, {
      width: '80vw',
      disableClose: false,
      data: { mode: 'edit', customer }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.customerService.updateCustomer(customer.id!, result).subscribe({
          next: () => {
            this.snackBar.open('Data pelanggan berhasil diperbarui!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadCustomers();
          },
          error: () => {
            this.snackBar.open('Gagal memperbarui data pelanggan', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }

  deleteCustomer(customer: Customer): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '440px',
      data: {
        title: 'Hapus Pelanggan',
        message: `Apakah Anda yakin ingin menghapus pelanggan "${customer.name}"?`,
        confirmText: 'Hapus',
        cancelText: 'Batal',
        warn: true
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.customerService.deleteCustomer(customer.id!).subscribe({
          next: () => {
            this.snackBar.open('Pelanggan berhasil dihapus', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadCustomers();
          },
          error: () => {
            this.snackBar.open('Gagal menghapus pelanggan', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }



  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadCustomers();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchSubject.next(filterValue);
  }
}
