import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { UserAccessService } from '../user-access.service';
import { User, Role, Employee } from '../models/object';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { UserDialogComponent } from './user-dialog.component';
import { AuthService } from '../../../services/auth.service';

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

  roleControl = new FormControl();
  filteredRoles$!: Observable<Role[]>;

  systemMenus: any[] = [];
  fullMenuTree: any[] = [];
  roleMenuIds: number[] = [];

  loading = false;
  isSavingMenus = false;
  filterValue = '';

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
    this.setupAutocomplete();
  }

  private setupAutocomplete(): void {
    this.filteredRoles$ = this.roleControl.valueChanges.pipe(
      startWith(''),
      map(value => {
        const name = typeof value === 'string' ? value : (this.getRoleName(value) || '');
        return name ? this._filterRoles(name) : this.roles.slice();
      })
    );

    this.roleControl.valueChanges.subscribe(value => {
      if (typeof value === 'number') {
        this.onRoleChange(value);
      }
    });
  }

  private _filterRoles(name: string): Role[] {
    const filterValue = name.toLowerCase();
    return this.roles.filter(role => role.roleName.toLowerCase().includes(filterValue));
  }

  getRoleName(id: number | null): string {
    if (!id) return '';
    const role = this.roles.find(r => r.id === id);
    return role ? role.roleName : '';
  }

  displayRole = (id: number): string => {
    return this.getRoleName(id);
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
    if (this.selectedUser && this.selectedUser.roleId) {
      this.roleControl.setValue(this.selectedUser.roleId, { emitEvent: false });
      this.loadRoleMenus(this.selectedUser.roleId);
    } else {
      this.roleControl.setValue(null, { emitEvent: false });
    }
  }

  onRoleChange(roleId: number): void {
    this.selectedRole = this.roles.find(r => r.id === roleId) || null;
    if (this.selectedUser) {
      this.selectedUser.roleId = roleId;
      this.api.updateUser(this.selectedUser.id!, this.selectedUser).subscribe({
        next: () => this.snackBar.open('Role pengguna berhasil diperbarui!', 'OK', { duration: 3000, panelClass: 'snack-success' }),
        error: () => this.snackBar.open('Gagal memperbarui role pengguna', 'Tutup', { duration: 3000, panelClass: 'snack-error' })
      });
      this.loadRoleMenus(roleId);
    }
  }


  openAddUserDialog(): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '520px',
      data: {
        roles: this.roles,
        employees: this.employees
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.api.createUser(result).subscribe({
          next: () => {
            this.snackBar.open('Pengguna baru berhasil ditambahkan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadData();
          },
          error: () => {
            this.snackBar.open('Gagal menambahkan pengguna baru', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
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

    this.isSavingMenus = true;
    this.cdr.detectChanges();

    this.api.updateRoleMenus(this.selectedRole.id, this.roleMenuIds).subscribe({
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
