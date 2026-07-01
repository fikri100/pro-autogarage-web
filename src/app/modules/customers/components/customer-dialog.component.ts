import { Component, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomerService } from '../customers.service';
import { Vehicle } from '../models/object';
import { VehicleDialogComponent } from './vehicle-dialog.component';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog.component';

export interface CustomerDialogData {
  mode: 'add' | 'edit' | 'confirm';
  customer?: any;
  message?: string;
}

@Component({
  selector: 'app-customer-dialog',
  templateUrl: '../views/customer-dialog.html',
  standalone: false
})
export class CustomerDialogComponent implements OnInit {
  customerForm!: FormGroup;
  isSaving = false;

  // State for Vehicles tab (edit mode)
  vehicles: Vehicle[] = [];
  loadingVehicles = false;

  // State for Service History tab (edit mode)
  transactions: any[] = [];
  loadingHistory = false;
  txDisplayedColumns: string[] = ['date', 'plate', 'notes', 'status'];

  statusMap: { [key: string]: { label: string; color: string } } = {
    PENDING: { label: 'Menunggu Persetujuan', color: '#d97706' },
    CONFIRMED: { label: 'Disetujui', color: '#0284c7' },
    IN_PROGRESS: { label: 'Sedang Dikerjakan', color: '#3b82f6' },
    COMPLETED: { label: 'Selesai Servis', color: '#10b981' },
    CANCELLED: { label: 'Dibatalkan', color: '#ef4444' },
    PAID: { label: 'Sudah Lunas', color: '#64748b' }
  };

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<CustomerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CustomerDialogData
  ) {}

  ngOnInit(): void {
    if (this.data.mode !== 'confirm') {
      this.customerForm = this.fb.group({
        name: [this.data.customer?.name ?? null, [Validators.required]],
        phone: [this.data.customer?.phone ?? null, [Validators.required, Validators.pattern('^[0-9]*$')]],
        email: [this.data.customer?.email ?? null, [Validators.email]],
        address: [this.data.customer?.address ?? null],
        plate: [null, [Validators.pattern(/^[A-Z]{1,3}\s[0-9]{1,4}\s[A-Z]{1,3}$/)]],
        brand: [null],
        year: [null]
      });

      if (this.data.mode === 'edit' && this.data.customer?.id) {
        this.loadVehicles(this.data.customer.id);
        this.loadHistory(this.data.customer.id);
      }
    }
  }

  // Vehicle CRUD methods
  loadVehicles(customerId: number): void {
    this.loadingVehicles = true;
    this.cdr.detectChanges();
    this.customerService.getVehiclesByCustomer(customerId).subscribe({
      next: (data: Vehicle[]) => {
        this.vehicles = data || [];
        this.loadingVehicles = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading vehicles:', err);
        this.snackBar.open('Gagal memuat data kendaraan', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.loadingVehicles = false;
        this.cdr.detectChanges();
      }
    });
  }

  openAddVehicleDialog(): void {
    if (!this.data.customer?.id) return;
    const dialogRef = this.dialog.open(VehicleDialogComponent, {
      width: '620px',
      data: { mode: 'add', customerId: this.data.customer.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.customerService.createVehicle(result).subscribe({
          next: () => {
            this.snackBar.open('Kendaraan berhasil ditambahkan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            if (this.data.customer?.id) {
              this.loadVehicles(this.data.customer.id);
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
            if (this.data.customer?.id) {
              this.loadVehicles(this.data.customer.id);
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
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '440px',
      data: {
        title: 'Hapus Kendaraan',
        message: 'Apakah Anda yakin ingin menghapus kendaraan ini dari daftar aset pelanggan?',
        confirmText: 'Hapus',
        cancelText: 'Batal',
        warn: true
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.customerService.deleteVehicle(id).subscribe({
          next: () => {
            this.snackBar.open('Kendaraan berhasil dihapus', 'OK', { duration: 3000, panelClass: 'snack-success' });
            if (this.data.customer?.id) {
              this.loadVehicles(this.data.customer.id);
            }
          },
          error: () => {
            this.snackBar.open('Gagal menghapus kendaraan', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }

  // History loading method
  loadHistory(customerId: number): void {
    this.loadingHistory = true;
    this.cdr.detectChanges();
    this.customerService.getBookingsByCustomer(customerId).subscribe({
      next: (res: any) => {
        const bookingsList = res.data || [];
        this.transactions = bookingsList.map((b: any) => ({
          date: b.bookingDate,
          plate: `${b.vehicleBrand || ''} ${b.vehicleModel || ''} (${b.licensePlate || ''})`,
          notes: b.complaints || 'Tidak ada keluhan tertulis',
          status: b.operationalStatus
        }));
        this.loadingHistory = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading customer booking history:', err);
        this.snackBar.open('Gagal memuat riwayat servis', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.loadingHistory = false;
        this.cdr.detectChanges();
      }
    });
  }

  getStatusDetails(status: string): { label: string; color: string } {
    return this.statusMap[status] || { label: status, color: '#64748b' };
  }

  getInitials(name: string): string {
    if (!name) return 'C';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  /**
   * Formats raw input into Indonesian license plate format: AA 1234 ABC
   * Strips invalid chars, auto-inserts spaces between letter/digit segments.
   */
  private formatPlate(raw: string): string {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const match = clean.match(/^([A-Z]{1,3})([0-9]{0,4})([A-Z]{0,3})/);
    if (!match) return clean;
    const [, prefix, numbers, suffix] = match;
    let result = prefix;
    if (numbers) result += ' ' + numbers;
    if (suffix)  result += ' ' + suffix;
    return result;
  }

  onPlateInput(event: any): void {
    const formatted = this.formatPlate(event.target.value);
    this.customerForm.get('plate')?.setValue(formatted, { emitEvent: false });
    event.target.value = formatted;
    event.target.setSelectionRange(formatted.length, formatted.length);
  }

  onPhoneKeyPress(event: KeyboardEvent): void {
    const charCode = event.key;
    if (!/^[0-9]$/.test(charCode) && charCode.length === 1) {
      event.preventDefault();
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '440px',
      data: {
        title: this.data.mode === 'add' ? 'Simpan Pelanggan' : 'Perbarui Pelanggan',
        message: this.data.mode === 'add'
          ? 'Apakah Anda yakin ingin menyimpan pelanggan baru ini?'
          : 'Apakah Anda yakin ingin memperbarui data pelanggan ini?',
        confirmText: 'Simpan',
        cancelText: 'Batal',
        warn: false
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.dialogRef.close(this.customerForm.value);
      }
    });
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
