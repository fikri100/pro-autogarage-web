import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MasterService } from '../master.service';
import { Role } from '../models/master.model';

@Component({
  selector: 'app-role-crud',
  templateUrl: '../views/role-crud.html',
  standalone: false
})
export class RoleCrudComponent implements OnInit {
  roles: Role[] = [];
  roleForm!: FormGroup;
  loading = false;
  isSaving = false;
  isEditMode = false;
  editingRoleId: number | null = null;
  displayedColumns: string[] = ['id', 'roleName', 'actions'];

  constructor(
    private fb: FormBuilder,
    private api: MasterService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadRoles();
  }

  private initForm(): void {
    this.roleForm = this.fb.group({
      roleName: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  loadRoles(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.api.getRoles().subscribe({
      next: (data) => {
        this.roles = data || [];
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

  selectForEdit(role: Role): void {
    this.isEditMode = true;
    this.editingRoleId = role.id!;
    this.roleForm.patchValue({
      roleName: role.roleName
    });
    this.cdr.detectChanges();
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.editingRoleId = null;
    this.roleForm.reset();
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.roleForm.invalid) return;
    this.isSaving = true;
    this.cdr.detectChanges();

    const payload: Role = {
      roleName: this.roleForm.value.roleName
    };

    if (this.isEditMode && this.editingRoleId !== null) {
      this.api.updateRole(this.editingRoleId, payload).subscribe({
        next: () => {
          this.snackBar.open('Role berhasil diperbarui!', 'OK', { duration: 3000, panelClass: 'snack-success' });
          this.isSaving = false;
          this.cancelEdit();
          this.loadRoles();
        },
        error: (err) => {
          this.snackBar.open('Gagal memperbarui role', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.api.createRole(payload).subscribe({
        next: () => {
          this.snackBar.open('Role baru berhasil ditambahkan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
          this.isSaving = false;
          this.roleForm.reset();
          this.loadRoles();
        },
        error: (err) => {
          this.snackBar.open('Gagal menambahkan role baru', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteRole(role: Role): void {
    if (confirm(`Apakah Anda yakin ingin menghapus role "${role.roleName}"?`)) {
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
  }
}
