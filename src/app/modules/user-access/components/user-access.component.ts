import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';

import { UserAccessService } from '../user-access.service';
import { User, Role } from '../models/object';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UserDetailComponent } from './user-detail.component';
import { AuthService } from '../../../services/auth.service';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog.component';

@Component({
  selector: 'app-user-access',
  templateUrl: '../views/user-access.html',
  standalone: false
})
export class UserAccessComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  roles: Role[] = [];

  selectedUser: User | null = null;
  selectedRole: Role | null = null;
  selectedMappingRoleId: number | null = null;

  systemMenus: any[] = [];
  fullMenuTree: any[] = [];
  roleMenuIds: number[] = [];

  loading = false;
  isSavingMenus = false;
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
    private dialog: MatDialog,
    private authService: AuthService
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

    this.api.getSystemMenus().subscribe((menus) => {
      this.systemMenus = menus || [];
      this.buildFullMenuTree();
      this.cdr.detectChanges();
    });

    this.api.getRoles().subscribe((roles: Role[]) => {
      this.roles = roles;
      if (this.roles.length > 0) {
        this.onMappingRoleChange(this.roles[0].id);
      }
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

  buildFullMenuTree(): void {
    const map: { [key: number]: any } = {};
    const roots: any[] = [];
    this.systemMenus.forEach(m => {
      map[m.id] = { ...m, children: [], isOpen: false };
    });
    this.systemMenus.forEach(m => {
      if (!m.parentId) {
        roots.push(map[m.id]);
      } else {
        if (map[m.parentId]) {
          map[m.parentId].children.push(map[m.id]);
        }
      }
    });
    this.fullMenuTree = roots;
  }

  toggleMenuAccordion(menu: any): void {
    menu.isOpen = !menu.isOpen;
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

  onMappingRoleChange(roleId: number): void {
    this.selectedMappingRoleId = roleId;
    this.selectedRole = this.roles.find(r => r.id === roleId) || null;
    if (this.selectedRole) {
      this.loadRoleMenus(roleId);
    }
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

  loadRoleMenus(roleId: number): void {
    this.api.getRoleMenus(roleId).subscribe({
      next: (ids) => {
        this.roleMenuIds = ids || [];
        this.cdr.detectChanges();
      }
    });
  }

  isMenuChecked(menuId: number): boolean {
    return this.roleMenuIds.includes(menuId);
  }

  toggleMenu(menuId: number): void {
    const idx = this.roleMenuIds.indexOf(menuId);
    if (idx > -1) {
      this.roleMenuIds.splice(idx, 1);
    } else {
      this.roleMenuIds.push(menuId);
    }
    this.cdr.detectChanges();
  }

  saveMenuPermissions(): void {
    if (!this.selectedRole) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '440px',
      data: {
        title: 'Simpan Hak Akses',
        message: `Apakah Anda yakin ingin menyimpan perubahan hak akses menu untuk role "${this.selectedRole.roleName}"?`,
        confirmText: 'Simpan',
        cancelText: 'Batal',
        warn: false
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.isSavingMenus = true;
        this.cdr.detectChanges();

        this.api.updateRoleMenus(this.selectedRole!.id, this.roleMenuIds).subscribe({
          next: () => {
            this.snackBar.open(`Hak akses menu untuk ${this.selectedRole!.roleName} berhasil disimpan!`, 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.isSavingMenus = false;
            
            // Dynamic reactive sidebar session update via BehaviorSubject
            const currentUser = this.authService.currentUser;
            if (currentUser && currentUser.roleId === this.selectedRole!.id) {
              const newMenus = this.buildMenuTree(this.systemMenus, this.roleMenuIds);
              currentUser.menus = newMenus;
              localStorage.setItem('pro_auto_garage_session', JSON.stringify(currentUser));
              // Push into the reactive stream so App component updates sidebar immediately
              this.authService.updateMenus(newMenus);
            }
            
            this.cdr.detectChanges();
          },
          error: () => {
            this.snackBar.open('Gagal menyimpan hak akses menu', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
            this.isSavingMenus = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  private buildMenuTree(flatMenus: any[], activeIds: number[]): any[] {
    const filtered = flatMenus.filter(m => activeIds.includes(m.id));
    const map: { [key: number]: any } = {};
    const roots: any[] = [];

    filtered.forEach(m => {
      map[m.id] = { 
        id: m.id,
        label: m.label,
        icon: m.icon,
        routerLink: m.routerLink,
        parentId: m.parentId,
        children: [],
        isOpen: false
      };
    });

    filtered.forEach(m => {
      const item = map[m.id];
      if (!m.parentId) {
        roots.push(item);
      } else {
        const parent = map[m.parentId];
        if (parent) {
          parent.children.push(item);
        }
      }
    });

    return roots;
  }
}
