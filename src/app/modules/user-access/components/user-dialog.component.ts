import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
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

  filteredEmployees$!: Observable<Employee[]>;
  filteredRoles$!: Observable<Role[]>;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.setupAutocomplete();
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      employeeId: [null, [Validators.required]],
      username: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._-]+$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      roleId: [null, [Validators.required]]
    });
  }

  private setupAutocomplete(): void {
    this.filteredEmployees$ = this.userForm.get('employeeId')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : (this.getEmployeeName(value) || '');
        return name ? this._filterEmployees(name) : this.data.employees.slice();
      })
    );

    this.filteredRoles$ = this.userForm.get('roleId')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : (this.getRoleName(value) || '');
        return name ? this._filterRoles(name) : this.data.roles.slice();
      })
    );
  }

  private _filterEmployees(name: string): Employee[] {
    const filterValue = name.toLowerCase();
    return this.data.employees.filter(emp => emp.name.toLowerCase().includes(filterValue) || emp.position.toLowerCase().includes(filterValue));
  }

  private _filterRoles(name: string): Role[] {
    const filterValue = name.toLowerCase();
    return this.data.roles.filter(role => role.roleName.toLowerCase().includes(filterValue));
  }

  getEmployeeName(id: number | null): string {
    if (!id) return '';
    const emp = this.data.employees.find(e => e.id === id);
    return emp ? `${emp.name} - ${emp.position}` : '';
  }

  getRoleName(id: number | null): string {
    if (!id) return '';
    const role = this.data.roles.find(r => r.id === id);
    return role ? role.roleName : '';
  }

  displayEmployee = (id: number): string => {
    return this.getEmployeeName(id);
  }

  displayRole = (id: number): string => {
    return this.getRoleName(id);
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
