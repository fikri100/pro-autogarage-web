import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { PortalService } from '../services/portal.service';

@Component({
  selector: 'app-portal-layout',
  templateUrl: '../views/portal-layout.html',
  standalone: false
})
export class PortalLayoutComponent implements OnInit {
  @ViewChild('sidenav') sidenav: any;
  isMobile = false;
  private wasMobile = false;
  customerName = '';

  menuItems = [
    { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/portal/dashboard' },
    { label: 'Buat Reservasi', icon: 'pi pi-calendar-plus', routerLink: '/portal/booking' },
    { label: 'Riwayat & Monitor', icon: 'pi pi-history', routerLink: '/portal/history' },
    { label: 'Kendaraan Saya', icon: 'pi pi-car', routerLink: '/portal/vehicles' },
    { label: 'Profil Saya', icon: 'pi pi-user', routerLink: '/portal/profile' }
  ];

  constructor(
    private portalService: PortalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const customer = this.portalService.currentCustomer;
    if (!customer) {
      this.router.navigate(['/portal/login']);
      return;
    }
    this.customerName = customer.name;
    this.isMobile = window.innerWidth < 1024;
    this.wasMobile = this.isMobile;
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

  getCustomerInitials(): string {
    const name = this.customerName;
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }

  logout(): void {
    this.portalService.logout();
  }
}
