import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MasterService } from '../master.service';
import { Employee, Role } from '../models/master.model';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog.component';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';

export interface EmployeeDetailData {
  mode: 'add' | 'edit';
  employee?: Employee;
}

@Component({
  selector: 'app-employee-detail',
  templateUrl: '../views/employee-detail.html',
  standalone: false
})
export class EmployeeDetailComponent implements OnInit {
  employeeForm!: FormGroup;
  isSaving = false;
  roles: Role[] = [];
  filteredRoles$!: Observable<Role[]>;

  constructor(
    private fb: FormBuilder,
    private api: MasterService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<EmployeeDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EmployeeDetailData
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadRoles();
  }

  private initForm(): void {
    this.employeeForm = this.fb.group({
      name: [this.data.employee?.name || '', [Validators.required, Validators.minLength(2)]],
      phone: [this.data.employee?.phone || '', [Validators.required, Validators.pattern('^[0-9]*$')]],
      position: [this.data.employee?.position || null, [Validators.required]],
      address: [this.data.employee?.address || '', []]
    });

    this.filteredRoles$ = this.employeeForm.get('position')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterRoles(value || ''))
    );
  }

  onPhoneKeyPress(event: KeyboardEvent): void {
    const charCode = event.key;
    if (!/^[0-9]$/.test(charCode) && charCode.length === 1) {
      event.preventDefault();
    }
  }

  private _filterRoles(value: string): Role[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    return this.roles.filter(role => role.roleName.toLowerCase().includes(filterValue));
  }

  loadRoles(): void {
    this.api.getRoles().subscribe({
      next: (data) => {
        this.roles = data || [];
        // Force filteredRoles$ to emit with the loaded roles
        const currentVal = this.employeeForm.get('position')?.value;
        this.employeeForm.get('position')?.setValue(currentVal, { emitEvent: true });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '440px',
      data: {
        title: this.data.mode === 'add' ? 'Simpan Karyawan' : 'Perbarui Karyawan',
        message: this.data.mode === 'add'
          ? 'Apakah Anda yakin ingin menyimpan karyawan baru ini?'
          : 'Apakah Anda yakin ingin memperbarui data karyawan ini?',
        confirmText: 'Simpan',
        cancelText: 'Batal',
        warn: false
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.dialogRef.close(this.employeeForm.value);
      }
    });
  }
}
