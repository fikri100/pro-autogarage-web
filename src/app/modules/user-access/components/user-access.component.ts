import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';

import { UserAccessService } from '../user-access.service';
import { User, Role } from '../models/object';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserDetailComponent } from './user-detail.component';

@Component({
  selector: 'app-user-access',
  templateUrl: '../views/user-access.html',
  standalone: false
})
export class UserAccessComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  roles: Role[] = [];

  loading = false;
  filterValue = '';

  // Pagination & Search
  totalData = 0;
  currentPage = 1;
  pageSize = 10;
  private searchSubject = new Subject<string>();

  displayedColumns: string[] = ['employeeName', 'role', 'status', 'actions'];

  constructor(
    private api: UserAccessService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadData();

    this.searchSubject.pipe(
      debounceTime(1000),
      distinctUntilChanged()
    ).subscribe(val => {
      this.filterValue = val;
      this.currentPage = 1;
      this.loadUsers();
    });
  }

  loadData(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.api.getRoles().subscribe((roles: Role[]) => {
      this.roles = roles;
      this.cdr.detectChanges();
    });

    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.api.getUsers(this.filterValue, this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.users = response.data || [];
        this.filteredUsers = [...this.users];
        this.totalData = response.pageResponse?.total || 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Gagal memuat data pengguna', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  openAddUserDialog(): void {
    const dialogRef = this.dialog.open(UserDetailComponent, {
      width: '520px',
      data: {
        mode: 'add',
        roles: this.roles
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.cdr.detectChanges();
        this.api.createUser(result).subscribe({
          next: () => {
            this.snackBar.open('Pengguna baru berhasil ditambahkan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadUsers();
          },
          error: () => {
            this.snackBar.open('Gagal menambahkan pengguna baru', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  openEditUserDialog(user: User): void {
    const dialogRef = this.dialog.open(UserDetailComponent, {
      width: '520px',
      data: {
        mode: 'edit',
        roles: this.roles,
        user
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.cdr.detectChanges();
        this.api.updateUser(user.id!, result).subscribe({
          next: () => {
            this.snackBar.open('Hak akses pengguna berhasil diperbarui!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadUsers();
          },
          error: () => {
            this.snackBar.open('Gagal memperbarui hak akses pengguna', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }
}
