import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { PortalService } from '../services/portal.service';

@Component({
  selector: 'app-portal-dashboard',
  templateUrl: '../views/portal-dashboard.html',
  standalone: false
})
export class PortalDashboardComponent implements OnInit {
  customerName = '';
  loadingSummary = false;
  loadingHistory = false;
  
  summary: any = {
    totalVehicles: 0,
    activeBookings: 0,
    totalHistory: 0
  };
  
  recentBookings: any[] = [];

  statusMap: { [key: string]: { label: string; color: string } } = {
    PENDING: { label: 'Menunggu Persetujuan', color: '#d97706' },
    CONFIRMED: { label: 'Disetujui / Aktif', color: '#0284c7' },
    CANCELLED: { label: 'Dibatalkan', color: '#ef4444' }
  };

  constructor(
    private portalService: PortalService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const customer = this.portalService.currentCustomer;
    if (!customer) {
      this.router.navigate(['/portal/login']);
      return;
    }
    this.customerName = customer.name;
    this.loadSummary();
    this.loadRecentBookings();
  }

  loadSummary(): void {
    this.loadingSummary = true;
    this.cdr.detectChanges();
    this.portalService.getDashboardSummary().subscribe({
      next: (data) => {
        if (data) {
          this.summary = data;
        }
        this.loadingSummary = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load dashboard summary:', err);
        this.loadingSummary = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadRecentBookings(): void {
    this.loadingHistory = true;
    this.cdr.detectChanges();
    this.portalService.getBookings().subscribe({
      next: (data) => {
        if (data) {
          // Take only the last 3 bookings for a clean dashboard view
          this.recentBookings = data.slice(0, 3);
        }
        this.loadingHistory = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load recent bookings:', err);
        this.loadingHistory = false;
        this.cdr.detectChanges();
      }
    });
  }

  getStatusDetails(status: string): { label: string; color: string } {
    return this.statusMap[status] || { label: status, color: '#64748b' };
  }
}
