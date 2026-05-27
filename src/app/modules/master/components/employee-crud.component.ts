import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MasterService } from '../master.service';
import { Employee } from '../models/master.model';

@Component({
  selector: 'app-employee-crud',
  templateUrl: '../views/employee-crud.html',
  standalone: false
})
export class EmployeeCrudComponent implements OnInit {
  employees: Employee[] = [];
  employeeForm!: FormGroup;
  loading = false;
  isSaving = false;
  isEditMode = false;
  editingEmployeeId: number | null = null;
  displayedColumns: string[] = ['name', 'position', 'phone', 'address', 'actions'];

  constructor(
    private fb: FormBuilder,
    private api: MasterService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadEmployees();
  }

  private initForm(): void {
    this.employeeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      position: ['', [Validators.required]],
      address: ['', []]
    });
  }

  loadEmployees(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.api.getEmployees().subscribe({
      next: (data) => {
        this.employees = data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Gagal memuat data karyawan', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  selectForEdit(employee: Employee): void {
    this.isEditMode = true;
    this.editingEmployeeId = employee.id!;
    this.employeeForm.patchValue({
      name: employee.name,
      phone: employee.phone,
      position: employee.position,
      address: employee.address || ''
    });
    this.cdr.detectChanges();
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.editingEmployeeId = null;
    this.employeeForm.reset();
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) return;
    this.isSaving = true;
    this.cdr.detectChanges();

    const payload: Employee = {
      name: this.employeeForm.value.name,
      phone: this.employeeForm.value.phone,
      position: this.employeeForm.value.position,
      address: this.employeeForm.value.address
    };

    if (this.isEditMode && this.editingEmployeeId !== null) {
      this.api.updateEmployee(this.editingEmployeeId, payload).subscribe({
        next: () => {
          this.snackBar.open('Karyawan berhasil diperbarui!', 'OK', { duration: 3000, panelClass: 'snack-success' });
          this.isSaving = false;
          this.cancelEdit();
          this.loadEmployees();
        },
        error: () => {
          this.snackBar.open('Gagal memperbarui karyawan', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.api.createEmployee(payload).subscribe({
        next: () => {
          this.snackBar.open('Karyawan baru berhasil ditambahkan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
          this.isSaving = false;
          this.employeeForm.reset();
          this.loadEmployees();
        },
        error: () => {
          this.snackBar.open('Gagal menambahkan karyawan baru', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          this.isSaving = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteEmployee(employee: Employee): void {
    if (confirm(`Apakah Anda yakin ingin menghapus karyawan "${employee.name}"?`)) {
      this.api.deleteEmployee(employee.id!).subscribe({
        next: () => {
          this.snackBar.open('Karyawan berhasil dihapus!', 'OK', { duration: 3000, panelClass: 'snack-success' });
          this.loadEmployees();
        },
        error: () => {
          this.snackBar.open('Gagal menghapus karyawan', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        }
      });
    }
  }
}
