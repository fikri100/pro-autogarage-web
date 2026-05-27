import { Component, ViewChild, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: false
})
export class App implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav: any;
  isMobile = false;
  private wasMobile = false;

  // Plain property — safe for *ngFor, no CD loop
  menuItems: any[] = [];
  private menusSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit() {
    this.isMobile = window.innerWidth < 1024;
    this.wasMobile = this.isMobile;

    // Subscribe to menus$ stream — reference stays stable between CD cycles
    this.menusSub = this.authService.menus$.subscribe(menus => {
      this.menuItems = menus;
    });
  }

  ngOnDestroy() {
    this.menusSub?.unsubscribe();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth < 1024;
    if (this.sidenav && this.isMobile !== this.wasMobile) {
      if (this.isMobile) {
        this.sidenav.close();
      } else {
        this.sidenav.open();
      }
      this.wasMobile = this.isMobile;
    }
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isPortalRoute(): boolean {
    return this.router.url.startsWith('/portal');
  }

  logout(): void {
    this.authService.logout();
  }

  getEmployeeName(): string {
    const user = this.authService.currentUser;
    return user?.employeeName || 'System User';
  }

  getRoleName(): string {
    const user = this.authService.currentUser;
    return user?.roleName || 'Operator';
  }

  getUserInitials(): string {
    const name = this.getEmployeeName();
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }
}
