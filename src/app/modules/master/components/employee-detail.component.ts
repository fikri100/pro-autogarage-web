import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MasterService } from '../master.service';
import { Employee } from '../models/master.model';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog.component';

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
  positions: any[] = [];

  constructor(
    private fb: FormBuilder,
    private api: MasterService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<EmployeeDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EmployeeDetailData
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadPositions();
  }

  private initForm(): void {
    this.employeeForm = this.fb.group({
      name: [this.data.employee?.name || '', [Validators.required, Validators.minLength(2)]],
      phone: [this.data.employee?.phone || '', [Validators.required, Validators.pattern('^[0-9]*$')]],
      positionId: [this.data.employee?.positionId || null, [Validators.required]],
      address: [this.data.employee?.address || '', []]
    });
  }

  onPhoneKeyPress(event: KeyboardEvent): void {
    const charCode = event.key;
    if (!/^[0-9]$/.test(charCode) && charCode.length === 1) {
      event.preventDefault();
    }
  }

  loadPositions(): void {
    this.api.getParamsByGroup('EMPLOYEE_POSITION').subscribe({
      next: (data) => {
        this.positions = data || [];
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
