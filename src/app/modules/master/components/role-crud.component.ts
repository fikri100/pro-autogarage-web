import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MasterService } from '../master.service';
import { Role } from '../models/master.model';
import { RoleDetailComponent } from './role-detail.component';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog.component';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-role-crud',
  templateUrl: '../views/role-crud.html',
  standalone: false
})
export class RoleCrudComponent implements OnInit {
  roles: Role[] = [];
  filteredRoles: Role[] = [];
  loading = false;
  displayedColumns: string[] = ['id', 'roleName', 'actions'];

  // Menu mapping properties
  systemMenus: any[] = [];
  fullMenuTree: any[] = [];
  roleMenuIds: number[] = [];
  selectedMappingRoleId: number | null = null;
  selectedRole: Role | null = null;
  isSavingMenus = false;

  constructor(
    private api: MasterService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadSystemMenus();
  }

  loadSystemMenus(): void {
    this.api.getSystemMenus().subscribe((menus) => {
      this.systemMenus = menus || [];
      this.buildFullMenuTree();
      this.cdr.detectChanges();
    });
  }

  loadRoles(): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.api.getRoles().subscribe({
      next: (data) => {
        this.roles = data || [];
        this.filteredRoles = [...this.roles];
        if (this.roles.length > 0 && !this.selectedMappingRoleId) {
          this.onMappingRoleChange(this.roles[0].id!);
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Gagal memuat data role', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  showAddDialog(): void {
    const dialogRef = this.dialog.open(RoleDetailComponent, {
      width: '450px',
      data: { mode: 'add' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.cdr.detectChanges();
        this.api.createRole(result).subscribe({
          next: () => {
            this.snackBar.open('Role baru berhasil ditambahkan!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadRoles();
          },
          error: () => {
            this.snackBar.open('Gagal menambahkan role baru', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  showEditDialog(role: Role): void {
    const dialogRef = this.dialog.open(RoleDetailComponent, {
      width: '450px',
      data: { mode: 'edit', role }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.cdr.detectChanges();
        this.api.updateRole(role.id!, result).subscribe({
          next: () => {
            this.snackBar.open('Role berhasil diperbarui!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadRoles();
          },
          error: () => {
            this.snackBar.open('Gagal memperbarui role', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      }
    });
  }

  deleteRole(role: Role): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '440px',
      data: {
        title: 'Hapus Role',
        message: `Apakah Anda yakin ingin menghapus role "${role.roleName}"?`,
        confirmText: 'Hapus',
        cancelText: 'Batal',
        warn: true
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.api.deleteRole(role.id!).subscribe({
          next: () => {
            this.snackBar.open('Role berhasil dihapus!', 'OK', { duration: 3000, panelClass: 'snack-success' });
            this.loadRoles();
          },
          error: () => {
            this.snackBar.open('Gagal menghapus role', 'Tutup', { duration: 3000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredRoles = this.roles.filter(r => 
      r.roleName.toLowerCase().includes(filterValue) ||
      (r.id && r.id.toString().includes(filterValue))
    );
  }

  // Menu Mapping logic
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

  onMappingRoleChange(roleId: number): void {
    this.selectedMappingRoleId = roleId;
    this.selectedRole = this.roles.find(r => r.id === roleId) || null;
    if (this.selectedRole) {
      this.loadRoleMenus(roleId);
    }
  }

  loadRoleMenus(roleId: number | undefined): void {
    if (roleId === undefined) return;
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

        this.api.updateRoleMenus(this.selectedRole!.id!, this.roleMenuIds).subscribe({
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
