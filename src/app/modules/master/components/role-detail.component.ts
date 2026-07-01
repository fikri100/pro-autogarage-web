import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Role } from '../models/master.model';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog.component';

export interface RoleDetailData {
  mode: 'add' | 'edit';
  role?: Role;
}

@Component({
  selector: 'app-role-detail',
  templateUrl: '../views/role-detail.html',
  standalone: false
})
export class RoleDetailComponent implements OnInit {
  roleForm!: FormGroup;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<RoleDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RoleDetailData
  ) {}

  ngOnInit(): void {
    this.roleForm = this.fb.group({
      roleName: [this.data.role?.roleName || '', [Validators.required, Validators.minLength(3)]]
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '440px',
      data: {
        title: this.data.mode === 'add' ? 'Simpan Role' : 'Perbarui Role',
        message: this.data.mode === 'add'
          ? 'Apakah Anda yakin ingin menyimpan role baru ini?'
          : 'Apakah Anda yakin ingin memperbarui data role ini?',
        confirmText: 'Simpan',
        cancelText: 'Batal',
        warn: false
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.dialogRef.close(this.roleForm.value);
      }
    });
  }
}
