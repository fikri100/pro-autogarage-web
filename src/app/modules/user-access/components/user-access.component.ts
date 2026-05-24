import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UserAccessService } from '../user-access.service';
import { User, Role, Employee } from '../models/object';

@Component({
  selector: 'app-user-access',
  templateUrl: '../views/user-access.html',
  standalone: false
})
export class UserAccessComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  roles: Role[] = [];
  employees: Employee[] = [];

  selectedUser: User | null = null;
  selectedRole: Role | null = null;

  permissions: any[] = [];

  loading = false;
  isSavingPermissions = false;
  filterValue = '';

  displayedColumns: string[] = ['employeeName', 'role', 'status', 'actions'];

  constructor(
    private api: UserAccessService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.cdr.detectChanges();

    this.api.getRoles().subscribe((roles: Role[]) => {
      this.roles = roles;
      this.cdr.detectChanges();
    });

    this.api.getEmployees().subscribe((emps: Employee[]) => {
      this.employees = emps.map((e: Employee) => ({ ...e, label: `${e.name} (${e.position})` })) as any;
      this.cdr.detectChanges();
    });

    this.api.getUsers().subscribe({
      next: (users: User[]) => {
        this.users = users || [];
        this.filteredUsers = [...this.users];
        if (this.users.length > 0) {
          this.selectUser(this.users[0]);
        }
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
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.filterValue = value;
    this.filteredUsers = this.users.filter(u =>
      u.username?.toLowerCase().includes(value) ||
      (u as any).roleName?.toLowerCase().includes(value) ||
      (u as any).employeeName?.toLowerCase().includes(value)
    );
  }

  selectUser(user: any): void {
    this.selectedUser = user as User;
    this.selectedRole = this.roles.find(r => r.id === this.selectedUser!.roleId) || null;
    this.parsePermissions();
  }

  onRoleChange(roleId: number): void {
    this.selectedRole = this.roles.find(r => r.id === roleId) || null;
    if (this.selectedUser) {
      this.selectedUser.roleId = roleId;
      this.api.updateUser(this.selectedUser.id!, this.selectedUser).subscribe({
        next: () => this.snackBar.open('Role pengguna berhasil diperbarui!', 'OK', { duration: 3000, panelClass: 'snack-success' }),
        error: () => this.snackBar.open('Gagal memperbarui role pengguna', 'Tutup', { duration: 3000, panelClass: 'snack-error' })
      });
    }
    this.parsePermissions();
  }

  parsePermissions(): void {
    if (!this.selectedRole) return;

    let parsed: any = {};
    try {
      parsed = JSON.parse(this.selectedRole.permissions);
    } catch (e) {}

    this.permissions = [
      { key: 'dashboard', module: 'Dashboard', create: false, read: false, update: false, delete: false },
      { key: 'master', module: 'Master Data', create: false, read: false, update: false, delete: false },
      { key: 'inventory', module: 'Inventory', create: false, read: false, update: false, delete: false },
      { key: 'cashier', module: 'Cashier', create: false, read: false, update: false, delete: false },
      { key: 'reports', module: 'Reports', create: false, read: false, update: false, delete: false }
    ];

    this.permissions.forEach(p => {
      if (parsed[p.key]) {
        p.create = parsed[p.key].create === 'Y';
        p.read = parsed[p.key].read === 'Y';
        p.update = parsed[p.key].update === 'Y';
        p.delete = parsed[p.key].delete === 'Y';
      }
    });
  }

  savePermissions(): void {
    if (!this.selectedRole) return;

    this.isSavingPermissions = true;
    const toSave: any = {};

    this.permissions.forEach(p => {
      toSave[p.key] = {
        create: p.create ? 'Y' : 'N',
        read: p.read ? 'Y' : 'N',
        update: p.update ? 'Y' : 'N',
        delete: p.delete ? 'Y' : 'N',
      };
    });

    this.api.updateRolePermissions(this.selectedRole.id, JSON.stringify(toSave)).subscribe({
      next: () => {
        this.snackBar.open(`Hak akses untuk ${this.selectedRole!.roleName} berhasil disimpan!`, 'OK', { duration: 3000, panelClass: 'snack-success' });
        this.selectedRole!.permissions = JSON.stringify(toSave);
        this.isSavingPermissions = false;
      },
      error: () => {
        this.snackBar.open('Gagal menyimpan hak akses', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.isSavingPermissions = false;
      }
    });
  }
}
