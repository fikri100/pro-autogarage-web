import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Role } from '../models/master.model';

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
    this.dialogRef.close(this.roleForm.value);
  }
}
