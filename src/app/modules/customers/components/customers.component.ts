import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CustomerService } from '../customers.service';
import { Customer } from '../models/object';
import { CustomerDialogComponent } from './customer-dialog.component';

@Component({
  selector: 'app-customer-list',
  templateUrl: '../views/customers.html',
  standalone: false
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  loading = false;

  selectedCustomer: Customer | null = null;

  // Mock Detail Data
  vehicles = [
    { plate: 'B 1234 ABC', brand: 'Toyota Kijang Innova', year: 2018, color: 'Hitam', transmission: 'Automatic (AT)', km: '65,200' },
    { plate: 'D 5678 DEF', brand: 'Honda Brio Satya', year: 2021, color: 'Kuning', transmission: 'Manual (MT)', km: '22,100' }
  ];

  transactions = [
    { date: '12 Okt 2023', plate: 'B 1234 ABC', notes: 'Ganti Oli & Filter, Cek Rem', status: 'Selesai' },
    { date: '05 Jan 2023', plate: 'B 1234 ABC', notes: 'Servis Berkala 60.000 KM', status: 'Selesai' }
  ];

  txDisplayedColumns: string[] = ['date', 'plate', 'notes', 'status'];

  constructor(
    private customerService: CustomerService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.customerService.getCustomers().subscribe({
      next: (data: Customer[]) => {
        this.customers = data || [];
        if (this.customers.length > 0 && !this.selectedCustomer) {
          this.selectedCustomer = this.customers[0];
        }
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

  selectCustomer(customer: Customer): void {
    this.selectedCustomer = customer;
  }

  getInitials(name: string): string {
    if (!name) return 'C';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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
      width: '620px',
      disableClose: false,
      data: { mode: 'edit', customer }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.customerService.updateCustomer(customer.id!, result).subscribe({
          next: () => {
            this.snackBar.open('Data pelanggan berhasil diperbarui!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            if (this.selectedCustomer?.id === customer.id) {
              this.selectedCustomer = { ...this.selectedCustomer, ...result };
            }
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
    const dialogRef = this.dialog.open(CustomerDialogComponent, {
      width: '400px',
      data: { mode: 'confirm', message: `Hapus pelanggan "${customer.name}"?` }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.customerService.deleteCustomer(customer.id!).subscribe({
          next: () => {
            this.snackBar.open('Pelanggan berhasil dihapus', 'OK', { duration: 3000, panelClass: 'snack-success' });
            if (this.selectedCustomer?.id === customer.id) {
              this.selectedCustomer = null;
            }
            this.loadCustomers();
          },
          error: () => {
            this.snackBar.open('Gagal menghapus pelanggan', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }
}
