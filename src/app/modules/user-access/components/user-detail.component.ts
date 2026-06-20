import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { User, Role, Employee } from '../models/object';
import { UserAccessService } from '../user-access.service';

export interface UserDetailData {
  mode: 'add' | 'edit';
  roles: Role[];
  user?: User;
}

@Component({
  selector: 'app-user-detail',
  templateUrl: '../views/user-detail.html',
  standalone: false
})
export class UserDetailComponent implements OnInit {
  @ViewChild('empTrigger', { read: MatAutocompleteTrigger }) empTrigger!: MatAutocompleteTrigger;

  userForm!: FormGroup;
  isSaving = false;

  employees: Employee[] = [];
  employeesLoaded = false;

  filteredEmployees$!: Observable<Employee[]>;
  filteredRoles$!: Observable<Role[]>;

  constructor(
    private fb: FormBuilder,
    private userAccessService: UserAccessService,
    public dialogRef: MatDialogRef<UserDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDetailData
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.setupAutocomplete();

    if (this.data.mode === 'edit' && this.data.user) {
      // If edit mode, populate the employees array with a single dummy entry so displayEmployee displays the correct text!
      this.employees = [{
        id: this.data.user.employeeId,
        name: this.data.user.employeeName || 'Karyawan',
        position: ''
      }];
      this.employeesLoaded = true;
      
      // Update form values
      this.userForm.patchValue({
        employeeId: this.data.user.employeeId,
        username: this.data.user.username,
        roleId: this.data.user.roleId
      });
    }
  }

  private initForm(): void {
    const isEdit = this.data.mode === 'edit';
    this.userForm = this.fb.group({
      employeeId: [{ value: null, disabled: isEdit }, [Validators.required]],
      username: [{ value: '', disabled: isEdit }, [Validators.required, Validators.pattern(/^[a-zA-Z0-9._-]+$/)]],
      password: [{ value: '', disabled: isEdit }, isEdit ? [] : [Validators.required, Validators.minLength(6)]],
      roleId: [null, [Validators.required]]
    });
  }

  onEmployeeFocus(): void {
    if (this.data.mode === 'edit') return;
    if (!this.employeesLoaded) {
      this.employeesLoaded = true;
      this.userAccessService.getEmployees().subscribe((res: any) => {
        const emps = res.data || res || [];
        this.employees = emps;
        // Trigger autocomplete filter refresh
        this.userForm.get('employeeId')?.setValue(this.userForm.get('employeeId')?.value);
        
        setTimeout(() => {
          if (this.empTrigger) {
            this.empTrigger.openPanel();
          }
        }, 150);
      });
    } else {
      if (this.empTrigger) {
        this.empTrigger.openPanel();
      }
    }
  }

  private setupAutocomplete(): void {
    this.filteredEmployees$ = this.userForm.get('employeeId')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : (this.getEmployeeName(value) || '');
        return name ? this._filterEmployees(name) : this.employees.slice();
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
    return this.employees.filter(emp => emp.name.toLowerCase().includes(filterValue) || emp.position.toLowerCase().includes(filterValue));
  }

  private _filterRoles(name: string): Role[] {
    const filterValue = name.toLowerCase();
    return this.data.roles.filter(role => role.roleName.toLowerCase().includes(filterValue));
  }

  getEmployeeName(id: number | null): string {
    if (!id) return '';
    const emp = this.employees.find(e => e.id === id);
    if (!emp) return '';
    return emp.position ? `${emp.name} - ${emp.position}` : emp.name;
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
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    
    // Get raw value because some inputs might be disabled
    const formVal = this.userForm.getRawValue();
    formVal.username = formVal.username.trim().toLowerCase();
    
    this.dialogRef.close(formVal);
  }
}
