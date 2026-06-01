import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MasterService } from '../master.service';
import { Employee, Role } from '../models/master.model';
import { Observable, Subject } from 'rxjs';
import { startWith, map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-employee-crud',
  templateUrl: '../views/employee-crud.html',
  standalone: false
})
export class EmployeeCrudComponent implements OnInit {
  employees: Employee[] = [];
  roles: Role[] = [];
  filteredRoles$!: Observable<Role[]>;
  employeeForm!: FormGroup;
  loading = false;
  isSaving = false;
  isEditMode = false;
  editingEmployeeId: number | null = null;
  displayedColumns: string[] = ['name', 'position', 'phone', 'address', 'actions'];

  // Pagination & Search States
  totalData = 0;
  currentPage = 1;
  pageSize = 10;
  searchSubject = new Subject<string>();
  searchQuery = '';

  constructor(
    private fb: FormBuilder,
    private api: MasterService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadEmployees();
    this.loadRoles();

    // Debounce search input for 1 second
    this.searchSubject.pipe(
      debounceTime(1000),
      distinctUntilChanged()
    ).subscribe(value => {
      this.searchQuery = value;
      this.currentPage = 1; // reset to first page on new search
      this.loadEmployees();
    });
  }

  private initForm(): void {
    this.employeeForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      position: [null, [Validators.required]],
      address: ['', []]
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
    const filterValue = value.toLowerCase();
    return this.roles.filter(role => role.roleName.toLowerCase().includes(filterValue));
  }

  loadRoles(): void {
    this.api.getRoles().subscribe({
      next: (data) => {
        this.roles = data || [];
        // Force filteredRoles$ to emit with the loaded roles!
        const currentVal = this.employeeForm.get('position')?.value;
        this.employeeForm.get('position')?.setValue(currentVal, { emitEvent: true });
      },
      error: () => {
        this.snackBar.open('Gagal memuat data role/jabatan', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
      }
    });
  }

  loadEmployees(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.api.getEmployees(this.searchQuery, this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.employees = response.data || [];
        this.totalData = response.pageResponse?.total || 0;
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

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadEmployees();
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

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchSubject.next(filterValue);
  }
}
