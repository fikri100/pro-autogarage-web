import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../master.service';
import { Role } from '../models/master.model';
import { RoleDetailComponent } from './role-detail.component';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog.component';

@Component({
  selector: 'app-role-crud',
  templateUrl: '../views/role-crud.html',
  standalone: false
})
export class RoleCrudComponent implements OnInit {
  roles: Role[] = [];
  filteredRoles: Role[] = [];
  loading = false;
  displayedColumns: string[] = ['id', 'roleName', 'actions'];

  constructor(
    private api: MasterService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.api.getRoles().subscribe({
      next: (data) => {
        this.roles = data || [];
        this.filteredRoles = [...this.roles];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Gagal memuat data role', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  showAddDialog(): void {
    const dialogRef = this.dialog.open(RoleDetailComponent, {
      width: '450px',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.cdr.detectChanges();
        this.api.createRole(result).subscribe({
          next: () => {
            this.snackBar.open('Role baru berhasil ditambahkan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadRoles();
          },
          error: () => {
            this.snackBar.open('Gagal menambahkan role baru', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  showEditDialog(role: Role): void {
    const dialogRef = this.dialog.open(RoleDetailComponent, {
      width: '450px',
      data: { mode: 'edit', role }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.cdr.detectChanges();
        this.api.updateRole(role.id!, result).subscribe({
          next: () => {
            this.snackBar.open('Role berhasil diperbarui!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadRoles();
          },
          error: () => {
            this.snackBar.open('Gagal memperbarui role', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  deleteRole(role: Role): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '440px',
      data: {
        title: 'Hapus Role',
        message: `Apakah Anda yakin ingin menghapus role "${role.roleName}"?`,
        confirmText: 'Hapus',
        cancelText: 'Batal',
        warn: true
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.api.deleteRole(role.id!).subscribe({
          next: () => {
            this.snackBar.open('Role berhasil dihapus!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadRoles();
          },
          error: () => {
            this.snackBar.open('Gagal menghapus role', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredRoles = this.roles.filter(r => 
      r.roleName.toLowerCase().includes(filterValue) ||
      (r.id && r.id.toString().includes(filterValue))
    );
  }
}
