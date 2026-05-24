import { Component, ViewChild, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  standalone: false
})
export class App implements OnInit {
  @ViewChild('sidenav') sidenav: any;
  isMobile = false;
  
  // Navigation Menu Items
  menuItems = [
    { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/dashboard' },
    { label: 'Master Data (Pelanggan)', icon: 'pi pi-database', routerLink: '/customers' },
    { label: 'Inventory', icon: 'pi pi-box', routerLink: '/inventory' },
    { label: 'Booking', icon: 'pi pi-calendar', routerLink: '/booking' },
    { label: 'Work Order', icon: 'pi pi-wrench', routerLink: '/work-order' },
    { label: 'Cashier', icon: 'pi pi-wallet', routerLink: '/cashier' },
    { label: 'Cashflow', icon: 'pi pi-money-bill', routerLink: '/cashflow' },
    { label: 'Reports', icon: 'pi pi-chart-bar', routerLink: '/reports' },
    { label: 'User Access', icon: 'pi pi-users', routerLink: '/user-access' }
  ];

  ngOnInit() {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth < 1024;
    if (this.sidenav) {
      if (this.isMobile) {
        this.sidenav.close();
      } else {
        this.sidenav.open();
      }
    }
  }
}
