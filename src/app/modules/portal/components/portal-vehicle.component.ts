import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PortalService } from '../services/portal.service';
import { PortalVehicleDialogComponent } from './portal-vehicle-dialog.component';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog.component';

@Component({
  selector: 'app-portal-vehicle',
  templateUrl: '../views/portal-vehicle.html',
  standalone: false
})
export class PortalVehicleComponent implements OnInit {
  vehicles: any[] = [];
  loading = false;

  constructor(
    private portalService: PortalService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    const customer = this.portalService.currentCustomer;
    if (!customer) {
      this.router.navigate(['/portal/login']);
      return;
    }
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.portalService.getVehicles().subscribe({
      next: (data) => {
        this.vehicles = data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load portal vehicles:', err);
        this.snackBar.open('Gagal memuat daftar kendaraan!', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onAddVehicle(): void {
    const dialogRef = this.dialog.open(PortalVehicleDialogComponent, {
      width: '600px',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.portalService.addVehicle(result).subscribe({
          next: () => {
            this.snackBar.open('Kendaraan berhasil ditambahkan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadVehicles();
          },
          error: (err) => {
            console.error('Failed to add vehicle:', err);
            const msg = err.error && err.error.error ? err.error.error : 'Gagal menambahkan kendaraan!';
            this.snackBar.open(msg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }

  onEditVehicle(vehicle: any): void {
    const dialogRef = this.dialog.open(PortalVehicleDialogComponent, {
      width: '600px',
      data: { mode: 'edit', vehicle }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.portalService.updateVehicle(vehicle.id, result).subscribe({
          next: () => {
            this.snackBar.open('Kendaraan berhasil diperbarui!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadVehicles();
          },
          error: (err) => {
            console.error('Failed to update vehicle:', err);
            const msg = err.error && err.error.error ? err.error.error : 'Gagal memperbarui kendaraan!';
            this.snackBar.open(msg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }

  onDeleteVehicle(vehicle: any): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '440px',
      data: {
        title: 'Hapus Kendaraan',
        message: `Apakah Anda yakin ingin menghapus kendaraan dengan plat ${vehicle.licensePlate}?`,
        confirmText: 'Hapus',
        cancelText: 'Batal',
        warn: true
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.portalService.deleteVehicle(vehicle.id).subscribe({
          next: () => {
            this.snackBar.open('Kendaraan berhasil dihapus!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadVehicles();
          },
          error: (err) => {
            console.error('Failed to delete vehicle:', err);
            const msg = err.error && err.error.error ? err.error.error : 'Gagal menghapus kendaraan!';
            this.snackBar.open(msg, 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }
}
