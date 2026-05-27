import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User, Role, Employee } from '../models/object';

export interface UserDialogData {
  roles: Role[];
  employees: Employee[];
}

@Component({
  selector: 'app-user-dialog',
  templateUrl: '../views/user-dialog.html',
  standalone: false
})
export class UserDialogComponent implements OnInit {
  userForm!: FormGroup;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      employeeId: [null, [Validators.required]],
      username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._-]+$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      roleId: [null, [Validators.required]]
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (this.userForm.invalid) return;
    this.isSaving = true;
    
    const formVal = { ...this.userForm.value };
    formVal.username = formVal.username.trim().toLowerCase();
    
    this.dialogRef.close(formVal);
  }
}
