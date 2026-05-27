import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CustomerService } from '../customers.service';
import { Customer, Vehicle } from '../models/object';
import { CustomerDialogComponent } from './customer-dialog.component';
import { VehicleDialogComponent } from './vehicle-dialog.component';

@Component({
  selector: 'app-customer-list',
  templateUrl: '../views/customers.html',
  standalone: false
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  loading = false;

  selectedCustomer: Customer | null = null;
  vehicles: Vehicle[] = [];

  // Mock Transactions for Service History
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
        if (this.customers.length > 0) {
          if (!this.selectedCustomer) {
            this.selectedCustomer = this.customers[0];
          }
          if (this.selectedCustomer.id) {
            this.loadVehicles(this.selectedCustomer.id);
          }
        } else {
          this.selectedCustomer = null;
          this.vehicles = [];
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
    if (customer && customer.id) {
      this.loadVehicles(customer.id);
    } else {
      this.vehicles = [];
    }
  }

  loadVehicles(customerId: number): void {
    this.customerService.getVehiclesByCustomer(customerId).subscribe({
      next: (data: Vehicle[]) => {
        this.vehicles = data || [];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading vehicles:', err);
        this.snackBar.open('Gagal memuat data kendaraan', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
      }
    });
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

  // Vehicle CRUD operations
  openAddVehicleDialog(): void {
    if (!this.selectedCustomer?.id) return;
    const dialogRef = this.dialog.open(VehicleDialogComponent, {
      width: '620px',
      data: { mode: 'add', customerId: this.selectedCustomer.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.customerService.createVehicle(result).subscribe({
          next: () => {
            this.snackBar.open('Kendaraan berhasil ditambahkan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            if (this.selectedCustomer?.id) {
              this.loadVehicles(this.selectedCustomer.id);
            }
          },
          error: () => {
            this.snackBar.open('Gagal menambahkan kendaraan', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }

  openEditVehicleDialog(vehicle: Vehicle): void {
    const dialogRef = this.dialog.open(VehicleDialogComponent, {
      width: '620px',
      data: { mode: 'edit', vehicle }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.customerService.updateVehicle(vehicle.id!, result).subscribe({
          next: () => {
            this.snackBar.open('Kendaraan berhasil diperbarui!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            if (this.selectedCustomer?.id) {
              this.loadVehicles(this.selectedCustomer.id);
            }
          },
          error: () => {
            this.snackBar.open('Gagal memperbarui kendaraan', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }

  deleteVehicle(id: number): void {
    const dialogRef = this.dialog.open(VehicleDialogComponent, {
      width: '400px',
      data: { mode: 'confirm', message: 'Hapus kendaraan dari daftar aset pelanggan?' }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.customerService.deleteVehicle(id).subscribe({
          next: () => {
            this.snackBar.open('Kendaraan berhasil dihapus', 'OK', { duration: 3000, panelClass: 'snack-success' });
            if (this.selectedCustomer?.id) {
              this.loadVehicles(this.selectedCustomer.id);
            }
          },
          error: () => {
            this.snackBar.open('Gagal menghapus kendaraan', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }
}
