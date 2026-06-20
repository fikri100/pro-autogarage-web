import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../master.service';
import { Employee } from '../models/master.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PageEvent } from '@angular/material/paginator';
import { EmployeeDetailComponent } from './employee-detail.component';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog.component';

@Component({
  selector: 'app-employee-crud',
  templateUrl: '../views/employee-crud.html',
  standalone: false
})
export class EmployeeCrudComponent implements OnInit {
  employees: Employee[] = [];
  loading = false;
  displayedColumns: string[] = ['name', 'position', 'phone', 'address', 'actions'];

  // Pagination & Search States
  totalData = 0;
  currentPage = 1;
  pageSize = 10;
  searchSubject = new Subject<string>();
  searchQuery = '';

  constructor(
    private api: MasterService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadEmployees();

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

  showAddDialog(): void {
    const dialogRef = this.dialog.open(EmployeeDetailComponent, {
      width: '650px',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.cdr.detectChanges();
        this.api.createEmployee(result).subscribe({
          next: () => {
            this.snackBar.open('Karyawan baru berhasil ditambahkan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadEmployees();
          },
          error: () => {
            this.snackBar.open('Gagal menambahkan karyawan baru', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  showEditDialog(employee: Employee): void {
    const dialogRef = this.dialog.open(EmployeeDetailComponent, {
      width: '650px',
      data: { mode: 'edit', employee }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.cdr.detectChanges();
        this.api.updateEmployee(employee.id!, result).subscribe({
          next: () => {
            this.snackBar.open('Karyawan berhasil diperbarui!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadEmployees();
          },
          error: () => {
            this.snackBar.open('Gagal memperbarui karyawan', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  deleteEmployee(employee: Employee): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '440px',
      data: {
        title: 'Hapus Karyawan',
        message: `Apakah Anda yakin ingin menghapus karyawan "${employee.name}"?`,
        confirmText: 'Hapus',
        cancelText: 'Batal',
        warn: true
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
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
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchSubject.next(filterValue);
  }
}
